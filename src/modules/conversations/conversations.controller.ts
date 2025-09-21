import { Body, Controller, Post } from '@nestjs/common';

import { ConversationsService } from './conversations.service';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  newConversation(@Body() labels: string[]) {
    return this.conversationsService.newConversation(labels);
  }
}
