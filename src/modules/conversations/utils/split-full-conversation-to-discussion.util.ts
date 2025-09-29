import {
  Conversation,
  ConversationMessage,
  FullConversation,
} from '../types/conversation.types';

import { CrispConversationMessages } from '@/modules/crisp/crisp.interface';

export const splitFullConversationToDiscussion = (
  conversation: CrispConversationMessages,
): FullConversation => {
  const fullConversation: FullConversation = {
    session_id: conversation[0].session_id,
    conversations: [],
  };
  let currentConversation: Conversation | null = null;

  for (const message of conversation) {
    if (typeof message.content === 'string' && message.content.trim() !== '') {
      if (!currentConversation) {
        currentConversation = {
          timestamp: message.timestamp,
          messages: [],
        };
      }

      const messageData: ConversationMessage = {
        from: message.from,
        content: message.content,
      };
      currentConversation.messages.push(messageData);
    }

    if (
      message.type === 'event' &&
      typeof message.content === 'object' &&
      message.content !== null &&
      'namespace' in message.content &&
      message.content.namespace === 'state:resolved'
    ) {
      if (currentConversation && currentConversation.messages.length > 0) {
        fullConversation.conversations.push({
          ...currentConversation,
          timestamp: message.timestamp,
        });
      }
      currentConversation = null;
    }
  }

  return fullConversation;
};
