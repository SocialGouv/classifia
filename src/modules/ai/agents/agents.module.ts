import { Module } from '@nestjs/common';

import { LlmModule } from '../llm/llm.module';

import { OpenaiAgentsService } from './openai-agents/openai-agents.service';

@Module({
  imports: [LlmModule],
  providers: [OpenaiAgentsService],
  exports: [OpenaiAgentsService],
})
export class AgentsModule {}
