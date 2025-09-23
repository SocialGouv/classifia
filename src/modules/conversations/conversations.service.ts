import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CONVERSATIONS_JOBS } from './conversations.job';

import { mockConversationClean } from '@/common/mocks/mock-data-clean.hide';
import { ClassifyConversationFlow } from '@/modules/ai/flows/classify-conversation.flow';
import { CrispService } from '@/modules/crisp/crisp.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly crisp: CrispService,
    @InjectQueue('conversations')
    private readonly conversationsQueue: Queue,
    private readonly classifyAgent: ClassifyConversationFlow,
  ) {}

  newConversation(conversation_id: string) {
    return this.conversationsQueue.add(CONVERSATIONS_JOBS.NEW_CONVERSATION, {
      conversation_id,
    });
  }

  getConversations() {
    return this.crisp.getConversations();
  }

  getConversationMessages(conversationId: string) {
    return this.crisp.getConversationMessages(conversationId);
  }

  async processConversation(_data: { labels: string[] }) {
    const res = await this.classifyAgent.execute({
      transcript: JSON.stringify(mockConversationClean || []),
    });
    return res;
  }
}
