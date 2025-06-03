export interface ChatSession {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
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