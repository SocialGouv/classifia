import { Injectable } from '@nestjs/common';
import { Agent, run } from '@openai/agents';
import z from 'zod';

import { AgentsChatModelAdapter } from '../../adapters/agents-chat-model.adapter';

@Injectable()
export class ClassifyAgent {
  constructor(private readonly model: AgentsChatModelAdapter) {}

  async classify(transcript: string) {
    try {
      const agent = new Agent({
        name: 'getLabelFromConverationAgent',
        instructions:
          'Tu vas recevoir un transcript de conversation. Analyse le et extrait le sujet principal. Tu dois répondre avec un objet JSON contenant un tableau de labels (sujets) extraits de la conversation. Format de réponse: {"labels": ["sujet1", "sujet2"]}',
        model: this.model,
        outputType: z.object({
          labels: z.array(z.string()),
        }),
      });

      const res = await run(agent, transcript);
      const label = String(res?.finalOutput ?? res?.output?.[0]?.content ?? '')
        .trim()
        .toLowerCase();
      return label;
    } catch (error) {
      console.error('Error classifying conversation:', error);
      throw error;
    }
  }
}
