import { Module } from '@nestjs/common';

import { LangChainChatModelAdapter } from '../adapters/langchain-chat-model.adapter';
import { OpenaiAgentsChatModelAdapter } from '../adapters/openai-agents-chat-model.adapter';
import { VercelAiChatModelAdapter } from '../adapters/vercel-ai-chat-model.adapter';
import { VoltAgentChatModelAdapter } from '../adapters/voltagent-chat-model.adapter';
import { LlmModule } from '../llm/llm.module';

import { ClassifyConversationLangGraphAgent } from './classify-conversation/classify-conversation.langgraph';
import { ClassifyConversationOpenaiAgent } from './classify-conversation/classify-conversation.openai-agent';
import { ClassifyConversationVercelAiAgent } from './classify-conversation/classify-conversation.vercel-ai';
import { ClassifyConversationVoltAgent } from './classify-conversation/classify-conversation.voltagent';

@Module({
  providers: [
    ClassifyConversationOpenaiAgent,
    ClassifyConversationLangGraphAgent,
    ClassifyConversationVoltAgent,
    ClassifyConversationVercelAiAgent,
    OpenaiAgentsChatModelAdapter,
    LangChainChatModelAdapter,
    VoltAgentChatModelAdapter,
    VercelAiChatModelAdapter,
  ],
  exports: [
    ClassifyConversationOpenaiAgent,
    ClassifyConversationLangGraphAgent,
    ClassifyConversationVoltAgent,
    ClassifyConversationVercelAiAgent,
    OpenaiAgentsChatModelAdapter,
    LangChainChatModelAdapter,
    VoltAgentChatModelAdapter,
    VercelAiChatModelAdapter,
  ],
  imports: [LlmModule],
})
export class AgentsModule {}
