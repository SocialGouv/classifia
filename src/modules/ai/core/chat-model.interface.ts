export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';
export interface ChatMessage {
  role: ChatRole;
  content: string;
}
export interface ChatOptions {
  temperature?: number;
  model?: string;
}

export interface ChatModel {
  chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<{ content: string }>;
}
