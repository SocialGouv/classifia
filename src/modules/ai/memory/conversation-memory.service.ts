import { Injectable } from '@nestjs/common';

import type { ChatMessage } from '../core/chat-model.interface';

@Injectable()
export class ConversationMemory {
  private store = new Map<string, ChatMessage[]>();
  private limit = 20;

  get(id: string): ChatMessage[] {
    return this.store.get(id) ?? [];
  }

  append(id: string, msg: ChatMessage) {
    const arr = this.get(id).concat(msg);
    this.store.set(id, arr.slice(-this.limit));
  }

  appendMany(id: string, msgs: ChatMessage[]) {
    for (const m of msgs) this.append(id, m);
  }
}
