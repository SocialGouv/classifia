import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { CrispModule } from '../crisp/crisp.module';
import { DrizzleModule } from '../drizzle/drizzle.module';

import { ConversationsController } from './conversations.controller';
import { CONVERSATIONS_QUEUE } from './conversations.job';
import { ConversationsService } from './conversations.service';
import { NewConversationProcessor } from './processors';

@Module({
  imports: [
    CrispModule,
    AiModule,
    DrizzleModule,
    BullModule.registerQueue({
      name: CONVERSATIONS_QUEUE,
    }),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, NewConversationProcessor],
})
export class ConversationsModule {}
