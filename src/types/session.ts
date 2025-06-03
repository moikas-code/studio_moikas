export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface SessionWithMessages {
  session: {
    id: string;
    name: string;
  };
  messages: ChatMessage[];
}

export interface SessionApiResponse {
  sessions: ChatSession[];
}

export interface CreateSessionRequest {
  name?: string;
}

export interface CreateSessionResponse {
  session: ChatSession;
}