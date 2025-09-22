import { Module } from '@nestjs/common';

import { AlbertModel } from './albert/albert.model';
import { OpenaiService } from './openai/openai.service';

@Module({
  providers: [AlbertModel, OpenaiService],
  exports: [AlbertModel, OpenaiService],
})
export class LlmModule {}
