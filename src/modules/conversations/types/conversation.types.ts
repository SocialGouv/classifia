export type ConversationMessage = {
  from: string;
  content: string;
};

export type Conversation = {
  timestamp: number;
  messages: ConversationMessage[];
};

export type FullConversation = {
  session_id: string;
  conversations: Conversation[];
};

export type ClassifiedConversation = {
  timestamp: number;
  description: string;
  confidence: number;
};

export type ClassifyOutput = {
  session_id: string;
  conversation: ClassifiedConversation;
};
