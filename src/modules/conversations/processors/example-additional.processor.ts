import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { CONVERSATIONS_QUEUE } from '../conversations.job';

@Processor(CONVERSATIONS_QUEUE)
export class ExampleAdditionalProcessor extends WorkerHost {
  private readonly logger = new Logger(ExampleAdditionalProcessor.name);

  constructor() {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'EXAMPLE_JOB') {
      await Promise.resolve(true);
      this.logger.log(`Processing example job: ${JSON.stringify(job.data)}`);
      return { status: 'ok' };
    }

    return null;
  }
}
