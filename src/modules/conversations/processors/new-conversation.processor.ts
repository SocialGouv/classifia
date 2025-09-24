import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { CONVERSATIONS_JOBS, CONVERSATIONS_QUEUE } from '../conversations.job';
import { ConversationsService } from '../conversations.service';

@Processor(CONVERSATIONS_QUEUE)
export class NewConversationProcessor extends WorkerHost {
  constructor(private readonly conversationsService: ConversationsService) {
    super();
  }

  async process(job: Job<{ conversation_id: string }>) {
    if (job.name === CONVERSATIONS_JOBS.NEW_CONVERSATION) {
      try {
        await this.conversationsService.processConversation(job.data);
        return { status: 'ok' };
      } catch (error) {
        console.error('Error processing conversation:', error);
        return { status: 'error' };
      }
    }

    return null;
  }
}
