import { Injectable } from '@nestjs/common';

import { AlbertService } from '../ai/albert/albert.service';
import { CrispService } from '../crisp/crisp.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly albert: AlbertService,
    private readonly crisp: CrispService,
  ) {}

  newConversation(_labels: string[]) {
    return this.albert.complete('Hello, how are you?');
  }

  getConversations(limit?: number) {
    return this.crisp.getConversations(limit);
  }
}
