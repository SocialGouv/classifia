import { Inject, Injectable } from '@nestjs/common';

import { CHAT_MODEL } from '../core/tokens';

import type { ChatModel } from '../core/chat-model.interface';

@Injectable()
export class VoltAgentChatModelAdapter {
  readonly specificationVersion = 'v2' as const;
  readonly provider = 'custom' as const;
  readonly modelId = 'custom-chat-model' as const;
  readonly supportedUrls = {};

  constructor(@Inject(CHAT_MODEL) private readonly model: ChatModel) {}

  async doGenerate(options: any) {
    const messages = options.messages.map((msg: any) => ({
      role: msg.role,
      content:
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content),
    }));

    const response = await this.model.chat(messages);

    return {
      content: [{ type: 'text' as const, text: response.content }],
      finishReason: 'stop' as const,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      warnings: [],
    };
  }

  doStream(): never {
    throw new Error('Streaming not supported');
  }
}
