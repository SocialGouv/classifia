import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { NewConversationDto } from './dto/new-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  newConversation(@Body() body: NewConversationDto) {
    return this.conversationsService.newConversation(body.conversation_id);
  }

  @Get()
  getConversations() {
    return this.conversationsService.getConversations();
  }

  @Get(':conversation_id')
  getConversationMessages(@Param('conversation_id') conversationId: string) {
    return this.conversationsService.getConversationMessages(conversationId);
  }
}
