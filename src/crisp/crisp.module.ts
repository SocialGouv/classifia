import { Module } from '@nestjs/common';
import { CrispService } from './crisp.service';
import { CrispController } from './crisp.controller';

@Module({
  controllers: [CrispController],
  providers: [CrispService],
})
export class CrispModule {}
