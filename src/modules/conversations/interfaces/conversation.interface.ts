export type Message = {
  from: string;
  content: string;
};

export type Conversation = {
  timestamp: number;
  messages: Message[];
};

export type FullConversation = {
  session_id: string;
  conversations: Conversation[];
};

export type ClassifiedConversation = {
  timestamp: number;
  description: string;
  embedding: number[];
};

export type ClassifyOutput = {
  session_id: string;
  conversations: ClassifiedConversation[];
};
