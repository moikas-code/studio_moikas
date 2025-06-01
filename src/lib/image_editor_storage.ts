import { Canvas_state } from './image_editor_utils';

export interface Editor_session {
  id: string;
  name: string;
  canvas_state: Canvas_state;
  created_at: string;
  updated_at: string;
  thumbnail?: string;
}

export interface Storage_provider {
  save_session: (session: Editor_session) => Promise<void>;
  load_session: (id: string) => Promise<Editor_session | null>;
  list_sessions: () => Promise<Editor_session[]>;
  delete_session: (id: string) => Promise<void>;
  get_current_session_id: () => Promise<string | null>;
  set_current_session_id: (id: string | null) => Promise<void>;
}

// LocalStorage implementation
export class Local_storage_provider implements Storage_provider {
  private readonly SESSIONS_KEY = 'image_editor_sessions';
  private readonly CURRENT_SESSION_KEY = 'image_editor_current_session';
  private readonly MAX_SESSIONS = 10; // Limit to 10 sessions max

  private async cleanup_old_sessions(sessions: Editor_session[]): Promise<Editor_session[]> {
    // Sort by updated_at (newest first) and keep only MAX_SESSIONS
    const sorted = sessions.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
    return sorted.slice(0, this.MAX_SESSIONS);
  }

  private async try_save_with_cleanup(sessions: Editor_session[]): Promise<void> {
    try {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Remove the oldest sessions and try again
        const cleaned_sessions = await this.cleanup_old_sessions(sessions.slice(0, Math.max(1, sessions.length - 2)));
        localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(cleaned_sessions));
      } else {
        throw error;
      }
    }
  }

  async save_session(session: Editor_session): Promise<void> {
    const sessions = await this.list_sessions();
    const existing_index = sessions.findIndex(s => s.id === session.id);
    
    if (existing_index >= 0) {
      sessions[existing_index] = session;
    } else {
      sessions.push(session);
    }
    
    // Clean up old sessions before saving
    const cleaned_sessions = await this.cleanup_old_sessions(sessions);
    await this.try_save_with_cleanup(cleaned_sessions);
  }

  async load_session(id: string): Promise<Editor_session | null> {
    const sessions = await this.list_sessions();
    return sessions.find(s => s.id === id) || null;
  }

  async list_sessions(): Promise<Editor_session[]> {
    const stored = localStorage.getItem(this.SESSIONS_KEY);
    if (!stored) return [];
    
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  async delete_session(id: string): Promise<void> {
    const sessions = await this.list_sessions();
    const filtered = sessions.filter(s => s.id !== id);
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(filtered));
    
    // Clear current session if it was deleted
    const current_id = await this.get_current_session_id();
    if (current_id === id) {
      await this.set_current_session_id(null);
    }
  }

  async get_current_session_id(): Promise<string | null> {
    return localStorage.getItem(this.CURRENT_SESSION_KEY);
  }

  async set_current_session_id(id: string | null): Promise<void> {
    if (id) {
      localStorage.setItem(this.CURRENT_SESSION_KEY, id);
    } else {
      localStorage.removeItem(this.CURRENT_SESSION_KEY);
    }
  }

  // Utility method to get storage usage info
  get_storage_info(): { used_mb: number; sessions_count: number; estimated_limit_mb: number } {
    try {
      const sessions_data = localStorage.getItem(this.SESSIONS_KEY) || '[]';
      const used_bytes = new Blob([sessions_data]).size;
      const used_mb = Math.round((used_bytes / 1024 / 1024) * 100) / 100;
      const sessions = JSON.parse(sessions_data);
      
      return {
        used_mb,
        sessions_count: sessions.length,
        estimated_limit_mb: 5, // Most browsers limit localStorage to ~5-10MB
      };
    } catch {
      return { used_mb: 0, sessions_count: 0, estimated_limit_mb: 5 };
    }
  }

  // Manual cleanup method - keeps only the 5 most recent sessions
  async cleanup_storage(): Promise<void> {
    const sessions = await this.list_sessions();
    const cleaned_sessions = await this.cleanup_old_sessions(sessions.slice(0, 5));
    localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(cleaned_sessions));
  }
}

// Database implementation (for future use)
export class Database_storage_provider implements Storage_provider {
  constructor(private user_id: string) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save_session(_session: Editor_session): Promise<void> {
    // TODO: Implement database save
    throw new Error('Database storage not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async load_session(_id: string): Promise<Editor_session | null> {
    // TODO: Implement database load
    throw new Error('Database storage not implemented yet');
  }

  async list_sessions(): Promise<Editor_session[]> {
    // TODO: Implement database list
    throw new Error('Database storage not implemented yet');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete_session(_id: string): Promise<void> {
    // TODO: Implement database delete
    throw new Error('Database storage not implemented yet');
  }

  async get_current_session_id(): Promise<string | null> {
    // TODO: Could store in localStorage or user preferences
    return localStorage.getItem('image_editor_current_session');
  }

  async set_current_session_id(id: string | null): Promise<void> {
    if (id) {
      localStorage.setItem('image_editor_current_session', id);
    } else {
      localStorage.removeItem('image_editor_current_session');
    }
  }
}

// Factory function to get the appropriate storage provider
export function get_storage_provider(use_database: boolean = false, user_id?: string): Storage_provider {
  if (use_database && user_id) {
    return new Database_storage_provider(user_id);
  }
  return new Local_storage_provider();
}

// Helper to generate thumbnails
export async function generate_thumbnail(canvas_state: Canvas_state, max_size: number = 200): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Calculate thumbnail dimensions
  const aspect_ratio = canvas_state.canvas_width / canvas_state.canvas_height;
  let thumb_width = max_size;
  let thumb_height = max_size / aspect_ratio;
  
  if (thumb_height > max_size) {
    thumb_height = max_size;
    thumb_width = max_size * aspect_ratio;
  }
  
  canvas.width = thumb_width;
  canvas.height = thumb_height;
  
  // Scale context
  ctx.scale(thumb_width / canvas_state.canvas_width, thumb_height / canvas_state.canvas_height);
  
  // Draw background if exists
  if (canvas_state.background_base64) {
    const bg_img = new Image();
    await new Promise((resolve) => {
      bg_img.onload = resolve;
      bg_img.src = `data:image/png;base64,${canvas_state.background_base64}`;
    });
    ctx.drawImage(bg_img, 0, 0, canvas_state.canvas_width, canvas_state.canvas_height);
  }
  
  // Draw main image if exists
  if (canvas_state.image_base64) {
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = `data:image/png;base64,${canvas_state.image_base64}`;
    });
    
    const transform = canvas_state.image_transform || {
      x: 0,
      y: 0,
      width: canvas_state.canvas_width,
      height: canvas_state.canvas_height,
      scale_x: 1,
      scale_y: 1,
    };
    
    ctx.drawImage(
      img,
      transform.x,
      transform.y,
      transform.width * transform.scale_x,
      transform.height * transform.scale_y
    );
  }
  
  // Draw text elements
  canvas_state.text_elements.forEach((text_element) => {
    ctx.save();
    ctx.translate(text_element.x, text_element.y);
    ctx.rotate((text_element.rotation * Math.PI) / 180);
    ctx.fillStyle = text_element.color;
    ctx.font = `${text_element.font_weight} ${text_element.font_size}px ${text_element.font_family}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text_element.text, 0, 0);
    ctx.restore();
  });
  
  return canvas.toDataURL('image/png', 0.8);
}