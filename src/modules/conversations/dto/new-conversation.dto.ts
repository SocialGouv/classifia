import { IsNotEmpty, IsString } from 'class-validator';

export class NewConversationDto {
  @IsString()
  @IsNotEmpty()
  conversation_id!: string;
}
