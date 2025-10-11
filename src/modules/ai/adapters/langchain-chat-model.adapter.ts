import { CallbackManagerForLLMRun } from '@langchain/core/callbacks/manager';
import { SimpleChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessageChunk, BaseMessage } from '@langchain/core/messages';
import { ChatGenerationChunk } from '@langchain/core/outputs';
import { Inject, Injectable } from '@nestjs/common';

import { CHAT_MODEL } from '../core/tokens';

import type { ChatMessage, ChatModel } from '../core/chat-model.interface';

@Injectable()
export class LangChainChatModelAdapter extends SimpleChatModel {
  modelName = 'custom-chat-model';

  constructor(@Inject(CHAT_MODEL) private readonly model: ChatModel) {
    super({});
  }

  _llmType(): string {
    return this.modelName;
  }

  private toChatMessages(messages: BaseMessage[]): ChatMessage[] {
    return messages.map((msg) => ({
      role: this.mapMessageType(msg._getType()),
      content:
        typeof msg.content === 'string'
          ? msg.content
          : JSON.stringify(msg.content),
    }));
  }

  private mapMessageType(
    type: string,
  ): 'system' | 'user' | 'assistant' | 'tool' {
    switch (type) {
      case 'system':
        return 'system';
      case 'human':
        return 'user';
      case 'ai':
        return 'assistant';
      case 'tool':
        return 'tool';
      default:
        return 'user';
    }
  }

  async _call(
    messages: BaseMessage[],
    options?: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): Promise<string> {
    const chatMessages = this.toChatMessages(messages);

    const response = await this.model.chat(chatMessages, {
      temperature: (options as any)?.temperature,
    });

    return response.content;
  }

  async *_streamResponseChunks(
    messages: BaseMessage[],
    options?: this['ParsedCallOptions'],
    _runManager?: CallbackManagerForLLMRun,
  ): AsyncGenerator<ChatGenerationChunk> {
    const result = await this._call(messages, options, _runManager);
    yield new ChatGenerationChunk({
      text: result,
      message: new AIMessageChunk(result),
    });
  }
}
