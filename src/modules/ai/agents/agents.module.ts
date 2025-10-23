import { Module } from '@nestjs/common';

import { OpenaiAgentsChatModelAdapter } from '../adapters/openai-agents-chat-model.adapter';
import { LlmModule } from '../llm/llm.module';
import { TopicRetrievalService } from '../services/topic-retrieval.service';

import { AssignTopicAgent } from './assign-topic/assign-topic.agent';
import { ClassifyConversationOpenaiAgent } from './classify-conversation/classify-conversation.openai-agent';

import { DrizzleModule } from '@/modules/drizzle/drizzle.module';

@Module({
  providers: [
    ClassifyConversationOpenaiAgent,
    AssignTopicAgent,
    TopicRetrievalService,
    OpenaiAgentsChatModelAdapter,
  ],
  exports: [
    ClassifyConversationOpenaiAgent,
    AssignTopicAgent,
    TopicRetrievalService,
    OpenaiAgentsChatModelAdapter,
  ],
  imports: [LlmModule, DrizzleModule],
})
export class AgentsModule {}
