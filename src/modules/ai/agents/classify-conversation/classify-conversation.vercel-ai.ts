import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { generateObject } from 'ai';
import { z } from 'zod';

import { classifyConversationPrompt } from './classify-conversation.prompt';
import { classifyConversationSchema } from './classify-conversation.schema';

import { VercelAiChatModelAdapter } from '@/modules/ai/adapters/vercel-ai-chat-model.adapter';

type ClassificationOutput = z.infer<typeof classifyConversationSchema>;

@Injectable()
export class ClassifyConversationVercelAiAgent {
  private readonly logger = new Logger(ClassifyConversationVercelAiAgent.name);

  constructor(private readonly model: VercelAiChatModelAdapter) {}

  async classify(transcript: string): Promise<ClassificationOutput> {
    try {
      const result = await generateObject({
        model: this.model,
        schema: classifyConversationSchema,
        prompt: transcript,
        system: classifyConversationPrompt,
        maxRetries: 3,
      });

      return result.object;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        this.logger.error(
          'LLM Response that failed schema validation:',
          JSON.stringify(error.response, null, 2),
        );
      }
      if (error && typeof error === 'object' && 'text' in error) {
        this.logger.error('Raw text response:', error.text);
      }

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
  }
}
