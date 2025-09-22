import { Injectable } from '@nestjs/common';
import { Agent, run } from '@openai/agents';

import { AlbertModel } from '../../llm/albert/albert.model';

@Injectable()
export class OpenaiAgentsService {
  constructor(private readonly albert: AlbertModel) {}

  async getLabelFromConverationAgent(conversation: string) {
    const model = this.albert;
    const agent = new Agent({
      name: 'getLabelFromConverationAgent',
      instructions:
        'Tu vas recevoir un transcript de conversation. Analyse le et extrait le sujet principal.',
      model,
    });

    const res = await run(agent, conversation);
    console.log(`${agent.name} response: `, res, '\n\n');
    console.log(`${agent.name} response output`, res.output[0].content, '\n\n');
    return res;
  }

  async sayHiAgent() {
    const model = this.albert;
    const agent = new Agent({
      name: 'sayHiAgent',
      instructions: 'You are a helpful assistant that can say hi',
      model,
    });

    const res = await run(agent, 'Hello, how are you? ');
    console.log(`${agent.name} response: `, res, '\n\n');
    console.log(`${agent.name} response output`, res.finalOutput, '\n\n');
    return res;
  }
}
