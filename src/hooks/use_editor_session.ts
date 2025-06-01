import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas_state } from '@/lib/image_editor_utils';
import { 
  Editor_session, 
  Storage_provider, 
  get_storage_provider,
  generate_thumbnail 
} from '@/lib/image_editor_storage';

interface Use_editor_session_props {
  canvas_state: Canvas_state;
  use_database?: boolean;
  user_id?: string;
  auto_save_interval?: number; // in milliseconds
}

export function useEditorSession({
  canvas_state,
  use_database = false,
  user_id,
  auto_save_interval = 30000, // 30 seconds default
}: Use_editor_session_props) {
  const [current_session_id, set_current_session_id] = useState<string | null>(null);
  const [session_name, set_session_name] = useState<string>('Untitled Project');
  const [is_saving, set_is_saving] = useState(false);
  const [last_saved, set_last_saved] = useState<Date | null>(null);
  const [sessions_list, set_sessions_list] = useState<Editor_session[]>([]);
  
  const storage = useRef<Storage_provider>(get_storage_provider(use_database, user_id));
  const auto_save_timer = useRef<NodeJS.Timeout | null>(null);
  const last_canvas_state = useRef<Canvas_state>(canvas_state);

  // Save current session
  const save_session = useCallback(async (name?: string) => {
    set_is_saving(true);
    
    try {
      const session_id = current_session_id || `session_${Date.now()}`;
      const session_name_to_use = name || session_name;
      
      // Generate thumbnail
      const thumbnail = await generate_thumbnail(canvas_state);
      
      const session: Editor_session = {
        id: session_id,
        name: session_name_to_use,
        canvas_state,
        created_at: current_session_id ? 
          (await storage.current.load_session(session_id))?.created_at || new Date().toISOString() : 
          new Date().toISOString(),
        updated_at: new Date().toISOString(),
        thumbnail,
      };
      
      await storage.current.save_session(session);
      await storage.current.set_current_session_id(session_id);
      
      set_current_session_id(session_id);
      set_session_name(session_name_to_use);
      set_last_saved(new Date());
      
      // Update sessions list
      const sessions = await storage.current.list_sessions();
      set_sessions_list(sessions);
      
      return session_id;
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error;
    } finally {
      set_is_saving(false);
    }
  }, [canvas_state, current_session_id, session_name]);

  // Initialize session on mount
  useEffect(() => {
    const init_session = async () => {
      const stored_id = await storage.current.get_current_session_id();
      if (stored_id) {
        const session = await storage.current.load_session(stored_id);
        if (session) {
          set_current_session_id(session.id);
          set_session_name(session.name);
          set_last_saved(new Date(session.updated_at));
        }
      }
      
      // Load sessions list
      const sessions = await storage.current.list_sessions();
      set_sessions_list(sessions);
    };
    
    init_session();
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (auto_save_interval && current_session_id) {
      // Clear existing timer
      if (auto_save_timer.current) {
        clearInterval(auto_save_timer.current);
      }
      
      // Set up new timer
      auto_save_timer.current = setInterval(() => {
        // Only save if canvas state has changed
        if (JSON.stringify(last_canvas_state.current) !== JSON.stringify(canvas_state)) {
          save_session();
          last_canvas_state.current = canvas_state;
        }
      }, auto_save_interval);
      
      return () => {
        if (auto_save_timer.current) {
          clearInterval(auto_save_timer.current);
        }
      };
    }
  }, [auto_save_interval, current_session_id, canvas_state, save_session]);

  // Load a session
  const load_session = useCallback(async (session_id: string) => {
    const session = await storage.current.load_session(session_id);
    if (session) {
      await storage.current.set_current_session_id(session_id);
      set_current_session_id(session_id);
      set_session_name(session.name);
      set_last_saved(new Date(session.updated_at));
      return session.canvas_state;
    }
    return null;
  }, []);

  // Create new session
  const new_session = useCallback(async () => {
    await storage.current.set_current_session_id(null);
    set_current_session_id(null);
    set_session_name('Untitled Project');
    set_last_saved(null);
  }, []);

  // Delete a session
  const delete_session = useCallback(async (session_id: string) => {
    await storage.current.delete_session(session_id);
    
    // Update sessions list
    const sessions = await storage.current.list_sessions();
    set_sessions_list(sessions);
    
    // If deleted current session, clear it
    if (session_id === current_session_id) {
      await new_session();
    }
  }, [current_session_id, new_session]);

  // Export session data (for manual backup)
  const export_session = useCallback(async () => {
    if (!current_session_id) return null;
    
    const session = await storage.current.load_session(current_session_id);
    if (session) {
      const data = JSON.stringify(session, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [current_session_id]);

  // Import session data
  const import_session = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const session = JSON.parse(text) as Editor_session;
      
      // Generate new ID to avoid conflicts
      session.id = `session_${Date.now()}`;
      session.updated_at = new Date().toISOString();
      
      await storage.current.save_session(session);
      await storage.current.set_current_session_id(session.id);
      
      set_current_session_id(session.id);
      set_session_name(session.name);
      set_last_saved(new Date());
      
      // Update sessions list
      const sessions = await storage.current.list_sessions();
      set_sessions_list(sessions);
      
      return session.canvas_state;
    } catch (error) {
      console.error('Failed to import session:', error);
      throw error;
    }
  }, []);

  return {
    // State
    current_session_id,
    session_name,
    is_saving,
    last_saved,
    sessions_list,
    
    // Actions
    save_session,
    load_session,
    new_session,
    delete_session,
    export_session,
    import_session,
    set_session_name,
  };
}