import { Module } from '@nestjs/common';

import { CrispService } from './crisp.service';

@Module({
  providers: [CrispService],
  exports: [CrispService],
})
export class CrispModule {}
