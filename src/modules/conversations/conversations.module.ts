import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';
import { CrispModule } from '../crisp/crisp.module';
import { DrizzleModule } from '../drizzle/drizzle.module';

import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [CrispModule, AiModule, DrizzleModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
})
export class ConversationsModule {}
