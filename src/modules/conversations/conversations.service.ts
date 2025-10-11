import { createHash } from 'crypto';

import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Queue } from 'bullmq';

import { ClassifyConversationVercelAiAgent } from '../ai/agents/classify-conversation/classify-conversation.vercel-ai';
import { AlbertEmbedding } from '../ai/llm/albert/albert.embedding';
import { DrizzleService } from '../drizzle/drizzle.service';

import { CONVERSATIONS_JOBS } from './conversations.job';
import {
  ClassificationAction,
  SIMILARITY_THRESHOLDS,
} from './types/classification.types';
import { ClassifyOutput } from './types/conversation.types';
import { splitFullConversationToDiscussion } from './utils/split-full-conversation-to-discussion.util';

import { CrispService } from '@/modules/crisp/crisp.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly crisp: CrispService,
    @InjectQueue('conversations')
    private readonly conversationsQueue: Queue,
    private readonly classifyConversationAgent: ClassifyConversationVercelAiAgent,
    private readonly embedding: AlbertEmbedding,
    private readonly drizzleService: DrizzleService,
  ) {}

  async newConversation(conversation_id: string) {
    await this.conversationsQueue.add(CONVERSATIONS_JOBS.NEW_CONVERSATION, {
      conversation_id,
    });
  }

  getConversations() {
    return this.crisp.getConversations();
  }

  getConversationMessages(conversationId: string) {
    return this.crisp.getConversationMessages(conversationId);
  }

  /**
   * Processes a conversation by classifying its content and creating subject associations
   * @param data - Object containing the conversation ID from Crisp
   * @returns Processing result with classified conversations and metadata
   */
  async processConversation(data: { conversation_id: string }) {
    if (!data.conversation_id) {
      throw new BadRequestException('Conversation ID is required');
    }

    let conversation;
    try {
      conversation = await this.crisp.getConversationMessages(
        data.conversation_id,
      );
    } catch (error) {
      this.logger.error(
        `Error fetching conversation from Crisp: ${data.conversation_id}`,
        error instanceof Error ? error.stack : error,
      );
      throw new ServiceUnavailableException(
        `Failed to fetch conversation from Crisp: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
    const discussions = splitFullConversationToDiscussion(conversation.data);
    if (discussions.conversations.length > 0) {
      const conversationText = JSON.stringify(conversation.data);
      const textHash = createHash('sha256')
        .update(conversationText)
        .digest('hex');

      let existingConversationByHash;
      try {
        existingConversationByHash =
          await this.drizzleService.getConversationByHash(textHash);
      } catch (error) {
        this.logger.error(
          'Error checking for existing conversation by hash',
          error instanceof Error ? error.stack : error,
        );
        throw new InternalServerErrorException(
          `Failed to check for existing conversation: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      if (existingConversationByHash) {
        return {
          status: 'skipped',
          reason: 'duplicate_hash',
          existingConversationId: existingConversationByHash.id,
        };
      }

      let dbConversation;
      try {
        dbConversation = await this.drizzleService.getConversationByCrispId(
          data.conversation_id,
        );
      } catch (error) {
        this.logger.error(
          'Error fetching conversation by Crisp ID',
          error instanceof Error ? error.stack : error,
        );
        throw new InternalServerErrorException(
          `Failed to fetch conversation by Crisp ID: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      if (!dbConversation) {
        try {
          dbConversation = await this.drizzleService.createConversation(
            data.conversation_id,
            textHash,
          );
        } catch (error) {
          this.logger.error(
            'Error creating conversation',
            error instanceof Error ? error.stack : error,
          );
          throw new InternalServerErrorException(
            `Failed to create conversation: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }
      }

      // Process each resolved discussion individually; ignore duplicates by conversationHash
      const finalConversations: any[] = [];

      for (const discussion of discussions.conversations) {
        const conversationHash = createHash('sha256')
          .update(JSON.stringify(discussion))
          .digest('hex');

        // If hash exists, strictly ignore (no DB write)
        const already =
          await this.drizzleService.getConversationSubjectByDiscussionHash(
            conversationHash,
          );
        if (already) {
          continue;
        }

        // Classify single discussion
        let classification: ClassifyOutput;
        try {
          classification = await this.classifyConversationAgent.classify(
            JSON.stringify({
              session_id: discussions.session_id,
              conversation: discussion,
            }),
          );
        } catch (error) {
          this.logger.error(
            'Error classifying single discussion',
            error instanceof Error ? error.stack : error,
          );
          throw new InternalServerErrorException(
            `Failed to classify discussion: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }

        const conv = classification.conversation;

        if (conv.description === 'SKIP') {
          // Persist SKIP with skip subject
          const skipSubject =
            await this.drizzleService.getOrCreateSkipSubject();
          await this.drizzleService.createConversationSubject({
            conversationId: dbConversation.id,
            subjectId: skipSubject.id,
            confidence: conv.confidence || 0.1,
            conversationTimestamp: new Date(conv.timestamp),
            conversationHash,
          });
          finalConversations.push({
            ...conv,
            embedding: null,
            subjectId: skipSubject.id,
            action: 'skip_classification',
          });
          continue;
        }

        // Embed and map to subject
        const [vec] = await this.embedding.embed([
          conv.description.toLowerCase(),
        ]);
        const embeddingVec = vec as number[];

        let similarSubjects;
        try {
          similarSubjects = await this.drizzleService.findSimilarSubjects(
            embeddingVec,
            SIMILARITY_THRESHOLDS.SUGGEST_GROUPING,
          );
        } catch (error) {
          this.logger.error(
            'Error finding similar subjects',
            error instanceof Error ? error.stack : error,
          );
          throw new InternalServerErrorException(
            `Failed to find similar subjects: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          );
        }

        let finalSubjectId: string | null = null;
        let finalAction: ClassificationAction = 'create_new_subject';
        let confidence = 1.0;

        if (similarSubjects.length > 0) {
          const bestMatch = similarSubjects[0];
          confidence = bestMatch.similarity;
          if (confidence >= SIMILARITY_THRESHOLDS.REUSE_EXISTING) {
            finalAction = 'reuse_existing';
            finalSubjectId = bestMatch.id;
          } else if (confidence >= SIMILARITY_THRESHOLDS.SUGGEST_GROUPING) {
            finalAction = 'suggest_grouping';
            finalSubjectId = bestMatch.id;
          }
        }

        if (finalAction === 'suggest_grouping' && finalSubjectId) {
          const aliasSubject = await this.drizzleService.createSubject(
            conv.description,
            embeddingVec,
            finalSubjectId,
          );
          finalSubjectId = aliasSubject.id;
          finalAction = 'created_alias_subject';
        } else if (finalAction === 'reuse_existing' && finalSubjectId) {
          finalAction = 'reused_existing_subject';
        } else if (finalAction === 'create_new_subject') {
          const newSubject = await this.drizzleService.createSubject(
            conv.description,
            embeddingVec,
          );
          finalSubjectId = newSubject.id;
          finalAction = 'created_new_subject';
        }

        await this.drizzleService.createConversationSubject({
          conversationId: dbConversation.id,
          subjectId: finalSubjectId as string,
          confidence,
          conversationTimestamp: new Date(conv.timestamp),
          conversationHash,
        });

        finalConversations.push({
          ...conv,
          embedding: embeddingVec,
          subjectId: finalSubjectId,
          action: finalAction,
          confidence,
        });
      }

      const result = {
        session_id: discussions.session_id,
        conversations: finalConversations,
        conversation_id: dbConversation.id,
      };

      return { conversations: result };
    }
    return { status: 'ok' };
  }
}
