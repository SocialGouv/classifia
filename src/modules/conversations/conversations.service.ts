import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

import { AlbertService } from '../ai/albert/albert.service';
import { CrispService } from '../crisp/crisp.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly albert: AlbertService,
    private readonly crisp: CrispService,
    @InjectQueue('conversations')
    private readonly conversationsQueue: Queue,
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
    const res = await this.albert.complete('Hello, how are you?');
    console.log('first', res);
    return res;
  }
}
