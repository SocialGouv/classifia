import { Module } from '@nestjs/common';

import { AgentsModule } from './agents/agents.module';
import { ClassifyConversationFlow } from './flows/classify-conversation.flow';
import { LlmModule } from './llm/llm.module';
import { ConversationMemory } from './memory/conversation-memory.service';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [ToolsModule, AgentsModule, LlmModule],
  providers: [ConversationMemory, ClassifyConversationFlow],
  exports: [ClassifyConversationFlow],
})
export class AiModule {}
