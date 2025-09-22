import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { OpenaiAgentsService } from '../ai/agents/openai-agents/openai-agents.service';
import { CrispService } from '../crisp/crisp.service';

import { mockConversationClean } from '@/common/mocks/mock-data-clean.hide';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly crisp: CrispService,
    @InjectQueue('conversations')
    private readonly conversationsQueue: Queue,
    private readonly openaiAgentsService: OpenaiAgentsService,
  ) {}

  newConversation(_labels: string[]) {
    return this.conversationsQueue.add('new-conversation', {
      labels: _labels,
    });
  }

  getConversations(limit?: number) {
    return this.crisp.getConversations(limit);
  }

  getConversationMessages(conversationId: string) {
    return this.crisp.getConversationMessages(conversationId);
  }

  async processConversation(_data: { labels: string[] }) {
    const res = await this.openaiAgentsService.getLabelFromConverationAgent(
      JSON.stringify(mockConversationClean || []),
    );
    return res;
  }
}
