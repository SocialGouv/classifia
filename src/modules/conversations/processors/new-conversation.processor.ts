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
    if (job.name === CONVERSATIONS_JOBS.PROCESS_CRISP_CONVERSATION) {
      try {
        this.logger.log(
          `Processing Crisp conversation: ${job.data.conversation_id}`,
        );
        const result = await this.conversationsService.processCrispConversation(
          job.data,
        );
        this.logger.log(
          `Successfully processed Crisp conversation: ${job.data.conversation_id}`,
        );
        return { status: 'ok', result };
      } catch (error) {
        this.logger.error(
          `Error processing Crisp conversation ${job.data.conversation_id}:`,
          error instanceof Error ? error.stack : error,
        );
        throw error;
      }
    }

    this.logger.warn(`Unknown job name: ${job.name}`);
    return null;
  }
}
