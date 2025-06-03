import { useState, useEffect, useCallback } from 'react';
import type { ChatSession, ChatMessage, SessionWithMessages } from '@/types/session';

interface UseSessionManagementReturn {
  sessions: ChatSession[];
  current_session: ChatSession | null;
  current_messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  fetch_sessions: () => Promise<void>;
  create_session: (name?: string) => Promise<string | null>;
  delete_session: (session_id: string) => Promise<boolean>;
  load_session: (session_id: string) => Promise<void>;
  clear_current_session: () => void;
}

export function useSessionManagement(): UseSessionManagementReturn {
  const [sessions, set_sessions] = useState<ChatSession[]>([]);
  const [current_session, set_current_session] = useState<ChatSession | null>(null);
  const [current_messages, set_current_messages] = useState<ChatMessage[]>([]);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);

  const fetch_sessions = useCallback(async () => {
    set_loading(true);
    set_error(null);
    
    try {
      const response = await fetch('/api/chat-sessions');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sessions');
      }
      
      set_sessions(data.sessions || []);
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to fetch sessions');
    } finally {
      set_loading(false);
    }
  }, []);

  const create_session = useCallback(async (name?: string): Promise<string | null> => {
    set_loading(true);
    set_error(null);
    
    try {
      const response = await fetch('/api/chat-sessions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }
      
      // Add new session to the list
      set_sessions(prev => [data.session, ...prev]);
      return data.session.id;
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to create session');
      return null;
    } finally {
      set_loading(false);
    }
  }, []);

  const delete_session = useCallback(async (session_id: string): Promise<boolean> => {
    set_loading(true);
    set_error(null);
    
    try {
      const response = await fetch(`/api/chat-sessions?session_id=${session_id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete session');
      }
      
      // Remove session from list
      set_sessions(prev => prev.filter(s => s.id !== session_id));
      
      // Clear current session if it was deleted
      if (current_session?.id === session_id) {
        set_current_session(null);
        set_current_messages([]);
      }
      
      return true;
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to delete session');
      return false;
    } finally {
      set_loading(false);
    }
  }, [current_session]);

  const load_session = useCallback(async (session_id: string): Promise<void> => {
    set_loading(true);
    set_error(null);
    
    try {
      const response = await fetch(`/api/chat-sessions/${session_id}/messages`);
      
      if (!response.ok) {
        const error_data = await response.json();
        throw new Error(error_data.error || 'Failed to load session');
      }
      
      const data: SessionWithMessages = await response.json();
      
      const session = sessions.find(s => s.id === session_id);
      if (session) {
        set_current_session(session);
        set_current_messages(data.messages);
      }
    } catch (err) {
      set_error(err instanceof Error ? err.message : 'Failed to load session');
    } finally {
      set_loading(false);
    }
  }, [sessions]);

  const clear_current_session = useCallback(() => {
    set_current_session(null);
    set_current_messages([]);
  }, []);

  // Fetch sessions on mount
  useEffect(() => {
    fetch_sessions();
  }, [fetch_sessions]);

  return {
    sessions,
    current_session,
    current_messages,
    loading,
    error,
    fetch_sessions,
    create_session,
    delete_session,
    load_session,
    clear_current_session
  };
}