import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { assistant, Usage } from '@openai/agents';

import { CHAT_MODEL } from '../core/tokens';

import type { ChatMessage, ChatModel } from '../core/chat-model.interface';
import type {
  Model,
  ModelRequest,
  ModelResponse,
  ResponseStreamEvent,
} from '@openai/agents';

@Injectable()
export class AgentsChatModelAdapter implements Model {
  private readonly logger = new Logger(AgentsChatModelAdapter.name);
  name = 'chat-model-adapter';
  constructor(@Inject(CHAT_MODEL) private readonly model: ChatModel) {}

  private toMessages(req: ModelRequest): ChatMessage[] {
    const messages: ChatMessage[] = [];
    if (req.systemInstructions) {
      messages.push({ role: 'system', content: req.systemInstructions });
    }
    const input = req.input;
    if (typeof input === 'string') {
      messages.push({ role: 'user', content: input });
    } else if (Array.isArray(input)) {
      const text = input
        .map((item: any) => {
          if (typeof item?.content === 'string') return item.content;
          if (Array.isArray(item?.content)) {
            return item.content
              .map((c: any) =>
                c?.type === 'input_text' ? c.text : (c?.transcript ?? ''),
              )
              .filter(Boolean)
              .join('\n');
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
      messages.push({ role: 'user', content: text });
    }
    return messages;
  }

  async getResponse(req: ModelRequest): Promise<ModelResponse> {
    const messages = this.toMessages(req);
    const res = await this.model.chat(messages);

    const content = res?.content || '';
    if (!content) {
      this.logger.error('No content received from chat model', {
        response: res,
      });
      throw new InternalServerErrorException(
        'No content received from chat model',
      );
    }

    return { output: [assistant(content)], usage: new Usage() };
  }

  async *getStreamedResponse(
    req: ModelRequest,
  ): AsyncIterable<ResponseStreamEvent> {
    const res = await this.getResponse(req);
    yield { type: 'response_done', response: res };
  }
}
