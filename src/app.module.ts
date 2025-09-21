import { Module } from '@nestjs/common';

import { AiModule } from './modules/ai/ai.module';
import { CrispModule } from './modules/crisp/crisp.module';

@Module({
  imports: [AiModule, CrispModule],
})
export class AppModule {}
