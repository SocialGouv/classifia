import { Module } from '@nestjs/common';

import { AgentsModule } from './agents/agents.module';
import { LlmModule } from './llm/llm.module';
import { ConversationMemory } from './memory/conversation-memory.service';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [ToolsModule, AgentsModule, LlmModule],
  providers: [ConversationMemory],
  exports: [ConversationMemory, AgentsModule, LlmModule],
})
export class AiModule {}
