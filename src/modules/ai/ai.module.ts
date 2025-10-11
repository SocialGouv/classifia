import { Module } from '@nestjs/common';

import { AgentsModule } from './agents/agents.module';
import { LlmModule } from './llm/llm.module';
import { ToolsModule } from './tools/tools.module';

@Module({
  imports: [ToolsModule, AgentsModule, LlmModule],
  providers: [],
  exports: [AgentsModule, LlmModule],
})
export class AiModule {}
