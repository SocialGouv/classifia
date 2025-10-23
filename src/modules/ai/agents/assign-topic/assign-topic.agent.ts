import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import z from 'zod';

import { assignTopicPrompt } from './assign-topic.prompt';

import { OpenaiAgentsChatModelAdapter } from '@/modules/ai/adapters/openai-agents-chat-model.adapter';
import { TopicRetrievalService } from '@/modules/ai/services/topic-retrieval.service';
import {
  TopicAssignmentOutput,
  VaeEntity,
} from '@/modules/conversations/types/hierarchical-classification.types';
import { DrizzleService } from '@/modules/drizzle/drizzle.service';

@Injectable()
export class AssignTopicAgent {
  private readonly logger = new Logger(AssignTopicAgent.name);

  constructor(
    private readonly model: OpenaiAgentsChatModelAdapter,
    private readonly topicRetrievalService: TopicRetrievalService,
    private readonly drizzleService: DrizzleService,
  ) {}

  async assignTopics({
    labelName,
    labelEmbedding,
    semanticContext,
    detectedEntity,
  }: {
    labelName: string;
    labelEmbedding: number[];
    semanticContext: string;
    detectedEntity: VaeEntity;
  }): Promise<TopicAssignmentOutput> {
    try {
      // Step 1: RAG - Retrieve similar topics using vector search
      const candidateTopics =
        await this.topicRetrievalService.retrieveSimilarTopics(
          labelEmbedding,
          0.6, // Lower threshold to get more candidates
          5,
        );

      // Step 2: Get all topics grouped by thematic for context
      const allTopicsByThematic =
        await this.topicRetrievalService.getAllTopicsByThematic();

      // Step 3: Get all thematics for reference
      const thematics = await this.drizzleService.getAllThematics();

      // Step 4: Format data for prompt
      const candidateTopicsFormatted =
        this.topicRetrievalService.formatCandidateTopicsForPrompt(
          candidateTopics,
        );

      const allTopicsFormatted =
        this.topicRetrievalService.formatTopicsByThematicForPrompt(
          allTopicsByThematic,
        );

      // Step 5: Build the prompt
      const promptWithData = assignTopicPrompt
        .replace('{{LABEL_NAME}}', labelName)
        .replace('{{SEMANTIC_CONTEXT}}', semanticContext)
        .replace('{{DETECTED_ENTITY}}', detectedEntity)
        .replace('{{CANDIDATE_TOPICS}}', candidateTopicsFormatted)
        .replace('{{ALL_TOPICS_BY_THEMATIC}}', allTopicsFormatted);

      // Step 6: Run the agent
      const agent = new Agent({
        name: 'assignTopicAgent',
        instructions: promptWithData,
        model: this.model,
        outputType: z.object({
          assignments: z.array(
            z.object({
              action: z.enum(['assign_existing', 'create_new']),
              topic_id: z.string().nullable(),
              topic_name: z.string(),
              topic_slug: z.string().optional(),
              thematic_id: z.string().nullable(),
              thematic_name: z.string(),
              is_primary: z.boolean(),
              confidence: z.number(),
              reasoning: z.string(),
            }),
          ),
        }),
      });

      const res = await run(
        agent,
        `Assigne le label "${labelName}" aux topics appropriés.`,
      );
      const output = res?.finalOutput ?? res?.output?.[0]?.content ?? null;

      if (!output) {
        this.logger.warn(
          `No output returned from agent for label: ${labelName}`,
        );
        return { assignments: [] };
      }

      if (!output.assignments || !Array.isArray(output.assignments)) {
        this.logger.warn(
          `Invalid assignments structure for label: ${labelName}`,
          output,
        );
        return { assignments: [] };
      }

      // Step 7: Process assignments and create new topics if needed
      const processedAssignments = await Promise.all(
        output.assignments.map(async (assignment) => {
          if (assignment.action === 'create_new') {
            // Find the thematic by name
            const thematic = thematics.find(
              (t) => t.name === assignment.thematic_name,
            );

            if (!thematic) {
              this.logger.error(
                `Thematic not found: ${assignment.thematic_name}. Available thematics: ${thematics.map((t) => t.name).join(', ')}`,
              );
              throw new BadRequestException(
                `Invalid thematic: ${assignment.thematic_name}. Available thematics: ${thematics.map((t) => t.name).join(', ')}`,
              );
            }

            // Create the new topic
            const newTopic = await this.drizzleService.createTopic({
              thematicId: thematic.id,
              name: assignment.topic_name,
              slug:
                assignment.topic_slug ||
                this.generateSlug(assignment.topic_name),
              embedding: labelEmbedding, // Use label embedding as initial topic embedding
              description: `Créé automatiquement pour: ${labelName}`,
            });

            this.logger.log(
              `Created new topic: ${newTopic.name} (${newTopic.id}) in thematic: ${assignment.thematic_name}`,
            );

            return {
              action: 'assign_existing' as const,
              topicId: newTopic.id,
              topicName: newTopic.name,
              thematicId: thematic.id,
              thematicName: thematic.name,
              isPrimary: assignment.is_primary,
              confidence: assignment.confidence,
              reasoning: `${assignment.reasoning} (nouveau topic créé)`,
            };
          }

          return {
            action: assignment.action,
            topicId: assignment.topic_id,
            topicName: assignment.topic_name,
            thematicId: assignment.thematic_id,
            thematicName: assignment.thematic_name,
            isPrimary: assignment.is_primary,
            confidence: assignment.confidence,
            reasoning: assignment.reasoning,
          };
        }),
      );

      // Filter out null values (failed creations)
      const validAssignments = processedAssignments.filter(
        (a) => a !== null,
      ) as TopicAssignmentOutput['assignments'];

      return { assignments: validAssignments };
    } catch (error) {
      this.logger.error(
        'Error assigning topics',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        `Error assigning topics: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Generates a URL-safe slug from a topic name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
