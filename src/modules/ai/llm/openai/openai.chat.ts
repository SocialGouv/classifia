import { Injectable } from '@nestjs/common';

import {
  ChatMessage,
  ChatModel,
  ChatOptions,
} from '../../core/chat-model.interface';

@Injectable()
export class OpenAIChat implements ChatModel {
  async chat(messages: ChatMessage[], _opts?: ChatOptions) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const joined = messages.map((m) => `${m.role}:${m.content}`).join('\n');
    return { content: joined.includes('facturation') ? 'billing' : 'support' };
  }
}
