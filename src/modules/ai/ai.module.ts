import { Module } from '@nestjs/common';

import { AiService } from './ai.service';
import { AlbertModule } from './albert/albert.module';

@Module({
  providers: [AiService],
  exports: [AiService, AlbertModule],
  imports: [AlbertModule],
})
export class AiModule {}
