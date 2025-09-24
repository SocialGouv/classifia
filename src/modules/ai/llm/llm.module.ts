import { Module } from '@nestjs/common';

import { CHAT_MODEL } from '../core/tokens';

import { AlbertChat } from './albert/albert.chat';
import { AlbertEmbedding } from './albert/albert.embedding';
import { OpenAIChat } from './openai/openai.chat';

@Module({
  providers: [
    OpenAIChat,
    AlbertChat,
    { provide: CHAT_MODEL, useExisting: AlbertChat },
    AlbertEmbedding,
  ],
  exports: [OpenAIChat, AlbertChat, CHAT_MODEL, AlbertEmbedding],
})
export class LlmModule {}
