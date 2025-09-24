export type CrispMessageType =
  | 'text'
  | 'event'
  | 'file'
  | 'audio'
  | 'animation'
  | 'picker'
  | 'note'
  | 'carousel';

export type CrispMessageFrom = 'user' | 'operator';

export interface CrispOperator {
  type?: string;
  nickname?: string;
  user_id?: string;
  email?: string;
  avatar?: string;
  [key: string]: unknown;
}

export interface CrispMessageOriginal {
  original_id: string;
}

export interface CrispEventContent {
  namespace: string;
  text?: string;
  [key: string]: unknown;
}

export interface CrispFileContent {
  name: string;
  url: string;
  type: string;
}

export interface CrispConversationMessage {
  session_id: string;
  website_id: string;
  fingerprint?: number;
  type: CrispMessageType;
  from: CrispMessageFrom;
  origin?: string;
  content?: string | CrispEventContent | CrispFileContent;
  timestamp: number;
  user?: CrispOperator;
  original?: CrispMessageOriginal;
  preview?: unknown[];
  mentions?: unknown[];
  read?: string;
  delivered?: string;
  stamped?: boolean;
  [key: string]: unknown;
}

export type CrispConversationMessages = CrispConversationMessage[];

export interface CrispConversationResponse {
  error: boolean;
  reason: string;
  data: CrispConversationMessages;
}
