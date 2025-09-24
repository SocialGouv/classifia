import { Injectable } from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import z from 'zod';

import { classifyPrompt } from './classify.prompt';

import { AgentsChatModelAdapter } from '@/modules/ai/adapters/agents-chat-model.adapter';

@Injectable()
export class ClassifyAgent {
  constructor(private readonly model: AgentsChatModelAdapter) {}

  async classify(transcript: string) {
    try {
      const agent = new Agent({
        name: 'thematicDescriptionAgent',
        instructions: classifyPrompt,
        model: this.model,
        outputType: z.object({
          session_id: z.string(),
          conversations: z.array(
            z.object({
              timestamp: z.number(),
              description: z.string(),
            }),
          ),
        }),
      });
      const res = await run(agent, transcript);
      const output = res?.finalOutput ?? res?.output?.[0]?.content ?? '';
      return output;
    } catch (error) {
      console.error('Error classifying conversation:', error);
      throw error;
    }
  }
}
