import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { CONVERSATIONS_QUEUE } from '../conversations/conversations.job';

import { CrispController } from './crisp.controller';
import { CrispService } from './crisp.service';

@Module({
  providers: [CrispService],
  exports: [CrispService],
  controllers: [CrispController],
  imports: [
    BullModule.registerQueue({
      name: CONVERSATIONS_QUEUE,
    }),
  ],
})
export class CrispModule {}
