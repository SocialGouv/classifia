import { Injectable } from '@nestjs/common';

import { AlbertService } from '../ai/albert/albert.service';
import { DrizzleService } from '../drizzle/drizzle.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly drizzle: DrizzleService,
    private readonly albert: AlbertService,
  ) {}

  newConversation(_labels: string[]) {
    return this.albert.complete('Hello, how are you?');
  }
}
