import { Injectable, Logger } from '@nestjs/common';

import { TopicWithContext } from '@/modules/conversations/types/hierarchical-classification.types';
import { DrizzleService } from '@/modules/drizzle/drizzle.service';

@Injectable()
export class TopicRetrievalService {
  private readonly logger = new Logger(TopicRetrievalService.name);

  constructor(private readonly drizzleService: DrizzleService) {}

  /**
   * Retrieves similar topics using vector search and enriches them with example labels
   */
  async retrieveSimilarTopics(
    embedding: number[],
    threshold: number = 0.75,
    limit: number = 5,
  ): Promise<TopicWithContext[]> {
    try {
      // Vector search for similar topics
      const similarTopics = await this.drizzleService.findSimilarTopics(
        embedding,
        threshold,
        limit,
      );

      // Enrich each topic with example labels for context
      const enrichedTopics = await Promise.all(
        similarTopics.map(async (topic) => {
          const exampleLabels =
            await this.drizzleService.getExampleLabelsForTopic(topic.id, 5);

          return {
            id: topic.id,
            name: topic.name,
            slug: topic.slug,
            thematicId: topic.thematicId,
            thematicName: topic.thematicName || '',
            similarity: topic.similarity,
            exampleLabels,
            description: undefined,
          };
        }),
      );

      return enrichedTopics;
    } catch (error) {
      this.logger.error(
        'Error retrieving similar topics',
        error instanceof Error ? error.stack : error,
      );
      return [];
    }
  }

  /**
   * Gets all topics grouped by thematic for prompt context
   */
  async getAllTopicsByThematic(): Promise<
    Record<string, Array<{ id: string; name: string; slug: string }>>
  > {
    try {
      const allTopics = await this.drizzleService.getAllTopicsWithThematics();

      const grouped: Record<
        string,
        Array<{ id: string; name: string; slug: string }>
      > = {};

      for (const topic of allTopics) {
        const thematicName = topic.thematicName || 'Unknown';
        if (!grouped[thematicName]) {
          grouped[thematicName] = [];
        }
        grouped[thematicName].push({
          id: topic.id,
          name: topic.name,
          slug: topic.slug,
        });
      }

      return grouped;
    } catch (error) {
      this.logger.error(
        'Error getting all topics by thematic',
        error instanceof Error ? error.stack : error,
      );
      return {};
    }
  }

  /**
   * Formats topics by thematic for prompt injection
   */
  formatTopicsByThematicForPrompt(
    topicsByThematic: Record<
      string,
      Array<{ id: string; name: string; slug: string }>
    >,
  ): string {
    let formatted = '';

    for (const [thematicName, topics] of Object.entries(topicsByThematic)) {
      formatted += `\n${thematicName}:\n`;
      for (const topic of topics) {
        formatted += `  - ${topic.name} (id: ${topic.id})\n`;
      }
    }

    return formatted;
  }

  /**
   * Formats candidate topics for prompt injection
   */
  formatCandidateTopicsForPrompt(candidateTopics: TopicWithContext[]): string {
    if (candidateTopics.length === 0) {
      return 'Aucun topic candidat trouvé par similarité vectorielle.';
    }

    let formatted = '';

    for (const topic of candidateTopics) {
      formatted += `\n- ${topic.name} (similarité: ${topic.similarity.toFixed(2)})\n`;
      formatted += `  Thématique: ${topic.thematicName}\n`;
      formatted += `  ID: ${topic.id}\n`;
      if (topic.exampleLabels.length > 0) {
        formatted += `  Exemples de labels: ${topic.exampleLabels.join(', ')}\n`;
      }
    }

    return formatted;
  }
}
