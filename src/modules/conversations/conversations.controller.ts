import { Body, Controller, Get, Post, Query } from '@nestjs/common';

import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  newConversation(@Body() labels: string[]) {
    return this.conversationsService.newConversation(labels);
  }

  @Get()
  getConversations(@Query('limit') limit?: string) {
    const parsedLimit = limit ? Number(limit) : 10;
    return this.conversationsService.getConversations(parsedLimit);
  }
}
