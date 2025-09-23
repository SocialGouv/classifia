import { Module } from '@nestjs/common';

import { CHAT_MODEL } from '../core/tokens';

import { AlbertChat } from './albert/albert.chat';
import { OpenAIChat } from './openai/openai.chat';

@Module({
  providers: [
    OpenAIChat,
    AlbertChat,
    { provide: CHAT_MODEL, useExisting: AlbertChat },
  ],
  exports: [OpenAIChat, AlbertChat, CHAT_MODEL],
})
export class LlmModule {}
