import { createHash } from 'crypto';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AssignTopicAgent } from '../ai/agents/assign-topic/assign-topic.agent';
import { ClassifyConversationOpenaiAgent } from '../ai/agents/classify-conversation/classify-conversation.openai-agent';
import { AlbertEmbedding } from '../ai/llm/albert/albert.embedding';
import { DrizzleService } from '../drizzle/drizzle.service';

import { ClassifyOutput } from './types/hierarchical-classification.types';
import { splitFullConversationToDiscussion } from './utils/split-full-conversation-to-discussion.util';

import { CrispService } from '@/modules/crisp/crisp.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);
  private readonly labelSimilarityThreshold: number;

  constructor(
    private readonly crisp: CrispService,
    private readonly classifyConversationAgent: ClassifyConversationOpenaiAgent,
    private readonly embedding: AlbertEmbedding,
    private readonly drizzleService: DrizzleService,
    private readonly assignTopicAgent: AssignTopicAgent,
    private readonly configService: ConfigService,
  ) {
    this.labelSimilarityThreshold =
      this.configService.get('LABEL_SIMILARITY_THRESHOLD') || 0.92;
  }

  /**
   * Processes a Crisp conversation using hierarchical classification
   * Multi-stage: Label extraction → Topic assignment → Storage
   */
  async processCrispConversation(data: { conversation_id: string }) {
    if (!data.conversation_id) {
      throw new BadRequestException('Conversation ID is required');
    }

    // Fetch messages from Crisp
    const conversation = await this.crisp.getConversationMessages(
      data.conversation_id,
    );

    const discussions = splitFullConversationToDiscussion(conversation.data);
    if (discussions.conversations.length === 0) {
      return { status: 'ok', message: 'No discussions to process' };
    }

    const sessionText = JSON.stringify(conversation.data);
    const sessionHash = createHash('sha256').update(sessionText).digest('hex');

    // Check if session already exists
    const existingSession =
      await this.drizzleService.getSessionByHash(sessionHash);
    if (existingSession) {
      return {
        status: 'skipped',
        reason: 'duplicate_session',
        sessionId: existingSession.id,
      };
    }

    // Create or get session
    let dbSession = await this.drizzleService.getSessionByCrispId(
      data.conversation_id,
    );
    if (!dbSession) {
      dbSession = await this.drizzleService.createSession(
        data.conversation_id,
        sessionHash,
      );
    }

    const processedDiscussions: any[] = [];

    // Process each discussion
    for (const discussion of discussions.conversations) {
      const discussionHash = createHash('sha256')
        .update(JSON.stringify(discussion))
        .digest('hex');

      // Check if discussion already classified
      const existingClassification =
        await this.drizzleService.getDiscussionClassificationByHash(
          discussionHash,
        );
      if (existingClassification) {
        continue;
      }

      // STAGE 1: Extract label with classification agent
      const classification: ClassifyOutput =
        await this.classifyConversationAgent.classify(
          JSON.stringify({
            session_id: discussions.session_id,
            conversation: discussion,
          }),
        );

      const { label, confidence, semantic_context, detected_entity } =
        classification.conversation;

      if (label === 'SKIP') {
        const skipLabel = await this.drizzleService.getOrCreateSkipLabel();
        const discussionRecord = await this.drizzleService.createDiscussion({
          sessionId: dbSession.id,
          timestamp: new Date(classification.conversation.timestamp),
          contentHash: discussionHash,
        });

        await this.drizzleService.createDiscussionClassification({
          discussionId: discussionRecord.id,
          labelId: skipLabel.id,
          confidence: confidence || 0.1,
          discussionTimestamp: new Date(classification.conversation.timestamp),
          discussionHash,
          classificationMethod: 'ai_agent',
          detectedEntity: detected_entity,
        });

        processedDiscussions.push({
          label: 'SKIP',
          action: 'skipped',
        });
        continue;
      }

      // Generate embedding for label
      const [labelEmbeddingVec] = await this.embedding.embed([
        label.toLowerCase(),
      ]);
      const labelEmbedding = labelEmbeddingVec as number[];

      // Find or create label
      const similarLabels = await this.drizzleService.findSimilarLabels(
        labelEmbedding,
        this.labelSimilarityThreshold,
        1,
      );

      let finalLabel;
      if (similarLabels.length > 0) {
        const similarLabel = similarLabels[0];
        finalLabel = await this.drizzleService.getLabelById(similarLabel.id);
        this.logger.debug(
          `Reusing existing label: ${finalLabel.name} (similarity: ${similarLabel.similarity.toFixed(3)})`,
        );
      } else {
        finalLabel = await this.drizzleService.createLabel({
          name: label.toLowerCase(),
          embedding: labelEmbedding,
          isCanonical: false,
        });
        this.logger.log(`Created new label: ${finalLabel.name}`);
      }

      // STAGE 2: Assign topics via RAG agent
      const topicAssignments = await this.assignTopicAgent.assignTopics({
        labelName: finalLabel.name,
        labelEmbedding,
        semanticContext: semantic_context,
        detectedEntity: detected_entity,
      });

      // Link label to topics
      for (const assignment of topicAssignments.assignments) {
        if (assignment.topicId) {
          await this.drizzleService.linkLabelToTopic({
            labelId: finalLabel.id,
            topicId: assignment.topicId,
            confidence: assignment.confidence,
            isPrimary: assignment.isPrimary,
            assignmentMethod: 'rag_agent',
          });
        }
      }

      // STAGE 3: Create discussion and classification
      const discussionRecord = await this.drizzleService.createDiscussion({
        sessionId: dbSession.id,
        timestamp: new Date(classification.conversation.timestamp),
        contentHash: discussionHash,
      });

      await this.drizzleService.createDiscussionClassification({
        discussionId: discussionRecord.id,
        labelId: finalLabel.id,
        confidence,
        discussionTimestamp: new Date(classification.conversation.timestamp),
        discussionHash,
        classificationMethod: 'ai_agent',
        detectedEntity: detected_entity,
      });

      processedDiscussions.push({
        label: finalLabel.name,
        topics: topicAssignments.assignments.map((a) => ({
          name: a.topicName,
          thematic: a.thematicName,
          isPrimary: a.isPrimary,
          confidence: a.confidence,
        })),
        confidence,
      });
    }

    return {
      status: 'success',
      sessionId: dbSession.id,
      discussionsProcessed: processedDiscussions.length,
      discussions: processedDiscussions,
    };
  }
}
