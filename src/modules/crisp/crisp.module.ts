import { Module } from '@nestjs/common';

import { CrispController } from './crisp.controller';
import { CrispService } from './crisp.service';

@Module({
  controllers: [CrispController],
  providers: [CrispService],
})
export class CrispModule {}
