import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
} from '@nestjs/common';

import { ConversationsService } from './conversations.service';
import { NewConversationDto } from './dto/new-conversation.dto';

@Controller('conversations')
export class ConversationsController {
  private readonly logger = new Logger(ConversationsController.name);

  constructor(private readonly conversationsService: ConversationsService) {}

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async newConversation(@Body() body: NewConversationDto) {
    this.logger.log(`Creating new conversation: ${body.conversation_id}`);
    const result = await this.conversationsService.newConversation(
      body.conversation_id,
    );
    this.logger.log(
      `Successfully queued conversation: ${body.conversation_id}`,
    );
    return result;
  }

  @Get()
  getConversations() {
    this.logger.log('Fetching all conversations');
    return this.conversationsService.getConversations();
  }

  @Get(':conversation_id')
  getConversationMessages(@Param('conversation_id') conversationId: string) {
    this.logger.log(`Fetching messages for conversation: ${conversationId}`);
    return this.conversationsService.getConversationMessages(conversationId);
  }
}
