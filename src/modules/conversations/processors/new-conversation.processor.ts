import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CONVERSATIONS_JOBS, CONVERSATIONS_QUEUE } from '../conversations.job';
import { ConversationsService } from '../conversations.service';

@Processor(CONVERSATIONS_QUEUE)
export class NewConversationProcessor extends WorkerHost {
  private readonly logger = new Logger(NewConversationProcessor.name);

  constructor(private readonly conversationsService: ConversationsService) {
    super();
  }

  async process(job: Job<{ conversation_id: string }>) {
    if (job.name === CONVERSATIONS_JOBS.NEW_CONVERSATION) {
      try {
        this.logger.log(`Processing conversation: ${job.data.conversation_id}`);
        const result = await this.conversationsService.processConversation(
          job.data,
        );
        this.logger.log(
          `Successfully processed conversation: ${job.data.conversation_id}`,
        );
        return { status: 'ok', result };
      } catch (error) {
        this.logger.error(
          `Error processing conversation ${job.data.conversation_id}:`,
          error instanceof Error ? error.stack : error,
        );

        // Re-throw the error to let BullMQ handle retries and dead letter queue
        throw error;
      }
    }

    this.logger.warn(`Unknown job name: ${job.name}`);
    return null;
  }
}
