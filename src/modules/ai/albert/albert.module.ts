import { Module } from '@nestjs/common';

import { AlbertService } from './albert.service';

@Module({
  providers: [AlbertService],
  exports: [AlbertService],
})
export class AlbertModule {}
