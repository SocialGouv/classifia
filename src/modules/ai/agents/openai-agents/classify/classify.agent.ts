import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import z from 'zod';

import { classifyPrompt } from './classify.prompt';

import { AgentsChatModelAdapter } from '@/modules/ai/adapters/agents-chat-model.adapter';

@Injectable()
export class ClassifyAgent {
  private readonly logger = new Logger(ClassifyAgent.name);
  constructor(private readonly model: AgentsChatModelAdapter) {}

  async classify(transcript: string) {
    try {
      const agent = new Agent({
        name: 'thematicDescriptionAgent',
        instructions: classifyPrompt,
        model: this.model,
        outputType: z.object({
          session_id: z.string(),
          conversation: z.object({
            timestamp: z.number(),
            description: z.string().max(100).min(3).or(z.literal('SKIP')),
            confidence: z.number(),
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
