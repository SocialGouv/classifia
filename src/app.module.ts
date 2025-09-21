import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { validateConfig } from './core/config/app/app.schema.config';
import { AiModule } from './modules/ai/ai.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { CrispModule } from './modules/crisp/crisp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateConfig,
    }),
    AiModule,
    CrispModule,
    ConversationsModule,
  ],
})
export class AppModule {}
