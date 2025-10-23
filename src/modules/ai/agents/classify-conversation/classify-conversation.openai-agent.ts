import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import z from 'zod';

import { classifyConversationPrompt } from './classify-conversation.prompt';

import { OpenaiAgentsChatModelAdapter } from '@/modules/ai/adapters/openai-agents-chat-model.adapter';
import { vaeEntityEnum } from '@/modules/drizzle/schema';

@Injectable()
export class ClassifyConversationOpenaiAgent {
  private readonly logger = new Logger(ClassifyConversationOpenaiAgent.name);
  constructor(private readonly model: OpenaiAgentsChatModelAdapter) {}

  async classify(transcript: string) {
    try {
      const agent = new Agent({
        name: 'classifyConversationAgent',
        instructions: classifyConversationPrompt,
        model: this.model,
        outputType: z.object({
          session_id: z.string(),
          conversation: z.object({
            timestamp: z.number(),
            label: z.string().max(100).min(3).or(z.literal('SKIP')),
            confidence: z.number(),
            semantic_context: z.string(),
            detected_entity: z
              .enum(vaeEntityEnum.enumValues)
              .default('non_identifie'),
          }),
        }),
      });
      const res = await run(agent, transcript);
      const output = res?.finalOutput ?? res?.output?.[0]?.content ?? '';
      return output;
    } catch (error) {
      this.logger.error(
        'Error classifying conversation',
        error instanceof Error ? error.stack : error,
      );
      throw new InternalServerErrorException(
        `Error classifying conversation: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }
}
