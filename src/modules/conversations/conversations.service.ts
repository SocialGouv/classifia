import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { CONVERSATIONS_JOBS } from './conversations.job';
import { splitFullConversationToDiscussion } from './utils/split-full-conversation-to-discussion.util';

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

  async newConversation(conversation_id: string) {
    await this.conversationsQueue.add(CONVERSATIONS_JOBS.NEW_CONVERSATION, {
      conversation_id,
    });
  }

  getConversations() {
    return this.crisp.getConversations();
  }

  getConversationMessages(conversationId: string) {
    return this.crisp.getConversationMessages(conversationId);
  }

  async processConversation(data: { conversation_id: string }) {
    const conversation = await this.crisp.getConversationMessages(
      data.conversation_id,
    );
    const discussions = splitFullConversationToDiscussion(conversation.data);
    if (discussions.conversations.length > 0) {
      await this.classifyAgent.execute({
        transcript: JSON.stringify(discussions),
      });
    }
    return { status: 'ok' };
  }
}
