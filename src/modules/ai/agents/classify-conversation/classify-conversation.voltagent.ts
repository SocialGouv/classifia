import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Agent } from '@voltagent/core';
import { z } from 'zod';

import { classifyConversationPrompt } from './classify-conversation.prompt';
import { classifyConversationSchema } from './classify-conversation.schema';

import { VoltAgentChatModelAdapter } from '@/modules/ai/adapters/voltagent-chat-model.adapter';

type ClassificationOutput = z.infer<typeof classifyConversationSchema>;

@Injectable()
export class ClassifyConversationVoltAgent {
  private readonly logger = new Logger(ClassifyConversationVoltAgent.name);

  constructor(private readonly model: VoltAgentChatModelAdapter) {}

  async classify(transcript: string): Promise<ClassificationOutput> {
    try {
      const agent = new Agent({
        name: 'ClassifyAgent',
        model: this.model,
        instructions: classifyConversationPrompt,
      });
      const response = await agent.generateObject(
        transcript,
        classifyConversationSchema,
      );

      return response.object;
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
  }
}
