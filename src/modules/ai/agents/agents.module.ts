import { Module } from '@nestjs/common';

import { AgentsChatModelAdapter } from '../adapters/agents-chat-model.adapter';
import { LlmModule } from '../llm/llm.module';

import { ClassifyAgent } from './openai-agents/classify.agent';

@Module({
  providers: [ClassifyAgent, AgentsChatModelAdapter],
  exports: [ClassifyAgent],
  imports: [LlmModule],
})
export class AgentsModule {}
