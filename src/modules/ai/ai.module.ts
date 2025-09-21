import { Module } from '@nestjs/common';

import { AlbertModule } from './albert/albert.module';
import { OpenaiModule } from './openai/openai.module';

@Module({
  exports: [AlbertModule, OpenaiModule],
  imports: [AlbertModule, OpenaiModule],
})
export class AiModule {}
