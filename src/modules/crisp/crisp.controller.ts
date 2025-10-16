import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Query,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CrispService } from './crisp.service';

@Controller('crisp')
export class CrispController {
  constructor(
    private readonly crispService: CrispService,
    private readonly configService: ConfigService,
  ) {}

  @Post('webhook/message-updated')
  webhookMessageUpdated(@Query('secret') secret: string, @Body() body: any) {
    console.log('secret', secret);
    if (secret !== this.configService.get('CRISP_WEBHOOK_SECRET')) {
      throw new BadRequestException('Invalid secret');
    }
    return this.crispService.webhookMessageUpdated(body);
  }
}
