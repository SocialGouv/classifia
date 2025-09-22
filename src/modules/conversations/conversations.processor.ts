import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { ConversationsService } from './conversations.service';

@Processor('conversations')
export class ConversationsProcessor extends WorkerHost {
  constructor(private readonly conversationsService: ConversationsService) {
    super();
  }
  async process(job: Job<{ labels: string[] }>) {
    switch (job.name) {
      case 'new-conversation':
        await this.conversationsService.processConversation(job.data);
        return { status: 'ok' };
      default:
        return { status: 'ignored', name: job.name };
    }
  }
}
