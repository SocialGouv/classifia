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

import { ClassifyAgent } from '../ai/agents/openai-agents/classify/classify.agent';
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
    private readonly classifyAgent: ClassifyAgent,
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

      let classificationResult: ClassifyOutput;
      try {
        classificationResult = await this.classifyAgent.classify(
          JSON.stringify(discussions),
        );
      } catch (error) {
        this.logger.error(
          'Error classifying conversation',
          error instanceof Error ? error.stack : error,
        );
        throw new InternalServerErrorException(
          `Failed to classify conversation: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      const descriptions = classificationResult.conversations
        .filter((conv) => conv.description !== 'SKIP')
        .map((conv) => conv.description.toLowerCase());

      let embeddings;
      try {
        embeddings =
          descriptions.length > 0
            ? await this.embedding.embed(descriptions)
            : [];
      } catch (error) {
        this.logger.error(
          'Error generating embeddings',
          error instanceof Error ? error.stack : error,
        );
        throw new InternalServerErrorException(
          `Failed to generate embeddings: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }

      const classifiedConversations = await Promise.all(
        classificationResult.conversations.map(async (conv, index) => {
          if (conv.description === 'SKIP') {
            return {
              ...conv,
              embedding: null,
              confidence: 0.1,
              subjectId: null,
              action: 'skip_classification',
            };
          }

          // Calculate embedding index for non-SKIP conversations
          const embeddingIndex = classificationResult.conversations
            .slice(0, index)
            .filter((c) => c.description !== 'SKIP').length;

          const embedding: number[] = embeddings[embeddingIndex];

          if (!embedding || embedding.length === 0) {
            return {
              ...conv,
              embedding,
              confidence: 0,
              subjectId: null,
              action: 'no_embedding',
            };
          }

          let similarSubjects;
          try {
            similarSubjects = await this.drizzleService.findSimilarSubjects(
              embedding,
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

          if (similarSubjects.length === 0) {
            return {
              ...conv,
              embedding,
              confidence: 1.0,
              subjectId: null,
              action: 'create_new_subject',
            };
          }

          const bestMatch = similarSubjects[0];
          const confidence = bestMatch.similarity;

          let action: ClassificationAction;
          if (confidence >= SIMILARITY_THRESHOLDS.REUSE_EXISTING) {
            action = 'reuse_existing';
          } else if (confidence >= SIMILARITY_THRESHOLDS.SUGGEST_GROUPING) {
            action = 'suggest_grouping';
          } else {
            action = 'create_new_subject';
          }

          return {
            ...conv,
            embedding,
            confidence,
            subjectId: bestMatch.id,
            action,
          };
        }),
      );

      const finalConversations = await Promise.all(
        classifiedConversations.map(async (conv) => {
          let finalSubjectId = conv.subjectId;
          let finalAction = conv.action;

          if (conv.action === 'reuse_existing') {
            finalAction = 'reused_existing_subject';
          } else if (conv.action === 'suggest_grouping') {
            try {
              const aliasSubject = await this.drizzleService.createSubject(
                conv.description,
                conv.embedding as number[],
                conv.subjectId,
              );
              finalSubjectId = aliasSubject.id;
              finalAction = 'created_alias_subject';
            } catch (error) {
              this.logger.error(
                'Error creating alias subject',
                error instanceof Error ? error.stack : error,
              );
              throw new InternalServerErrorException(
                `Failed to create alias subject: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          } else if (
            conv.action === 'create_new_subject' &&
            conv.embedding &&
            conv.embedding.length > 0
          ) {
            try {
              const newSubject = await this.drizzleService.createSubject(
                conv.description,
                conv.embedding,
              );
              finalSubjectId = newSubject.id;
              finalAction = 'created_new_subject';
            } catch (error) {
              this.logger.error(
                'Error creating new subject',
                error instanceof Error ? error.stack : error,
              );
              throw new InternalServerErrorException(
                `Failed to create new subject: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          }

          if (finalSubjectId && conv.action !== 'skip_classification') {
            try {
              await this.drizzleService.createConversationSubject({
                conversationId: dbConversation.id,
                subjectId: finalSubjectId as string,
                confidence: conv.confidence || 0,
                conversationTimestamp: new Date(conv.timestamp),
              });
            } catch (error) {
              this.logger.error(
                'Error creating conversation subject',
                error instanceof Error ? error.stack : error,
              );
              throw new InternalServerErrorException(
                `Failed to create conversation subject: ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          }

          return {
            ...conv,
            subjectId: finalSubjectId,
            action: finalAction,
          };
        }),
      );

      const result = {
        session_id: classificationResult.session_id,
        conversations: finalConversations,
        conversation_id: dbConversation.id,
      };

      return { conversations: result };
    }
    return { status: 'ok' };
  }
}
