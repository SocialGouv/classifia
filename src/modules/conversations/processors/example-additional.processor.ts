import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

import { CONVERSATIONS_QUEUE } from '../conversations.job';

@Processor(CONVERSATIONS_QUEUE)
export class ExampleAdditionalProcessor extends WorkerHost {
  constructor() {
    super();
  }

  async process(job: Job<any>) {
    if (job.name === 'EXAMPLE_JOB') {
      await Promise.resolve(true);
      console.log('Processing example job:', job.data);
      return { status: 'ok' };
    }

    return null;
  }
}
