import { Injectable } from '@nestjs/common';

import { ClassifyAgent } from '../agents/openai-agents/classify.agent';

@Injectable()
export class ClassifyConversationFlow {
  constructor(private readonly agent: ClassifyAgent) {}

  async execute(input: { transcript: string }) {
    const label = await this.agent.classify(input.transcript);
    console.log('label', label);

    return { label };
  }
}
