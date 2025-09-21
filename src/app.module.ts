import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { CrispModule } from './crisp/crisp.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AiModule, CrispModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
