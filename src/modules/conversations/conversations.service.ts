import { Injectable } from '@nestjs/common';

import { DrizzleService } from '../drizzle/drizzle.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly drizzle: DrizzleService) {}

  newConversation(labels: string[]) {
    console.log(labels);
  }
}
