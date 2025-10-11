import { Inject, Injectable, Logger } from '@nestjs/common';

import { CHAT_MODEL } from '../core/tokens';

import type {
  ChatMessage,
  ChatModel,
  ChatRole,
} from '../core/chat-model.interface';

@Injectable()
export class VercelAiChatModelAdapter {
  private readonly logger = new Logger(VercelAiChatModelAdapter.name);
  readonly specificationVersion = 'v2' as const;
  readonly provider = 'custom' as const;
  readonly modelId = 'albert-custom-model' as const;
  readonly supportedUrls = {};

  constructor(@Inject(CHAT_MODEL) private readonly model: ChatModel) {}

  async doGenerate(options: any) {
    let messages: ChatMessage[];

    if (options.messages && Array.isArray(options.messages)) {
      messages = options.messages.map((msg: any) => ({
        role: msg.role as ChatRole,
        content:
          typeof msg.content === 'string'
            ? msg.content
            : JSON.stringify(msg.content),
      }));
    } else if (options.prompt) {
      messages = [];
      if (options.system) {
        messages.push({
          role: 'system' as ChatRole,
          content: options.system,
        });
      }
      messages.push({
        role: 'user' as ChatRole,
        content:
          typeof options.prompt === 'string'
            ? options.prompt
            : JSON.stringify(options.prompt),
      });
    } else {
      throw new Error(
        'Invalid options format: expected either messages array or prompt',
      );
    }

    const response = await this.model.chat(messages);

    this.logger.debug('Raw LLM response:', response.content);

    try {
      JSON.parse(response.content);
    } catch (error) {
      this.logger.warn(
        'LLM returned invalid JSON:',
        response.content.substring(0, 500),
      );
      throw error;
    }

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
