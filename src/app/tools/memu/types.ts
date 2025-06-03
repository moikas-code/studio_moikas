export interface message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface workflow {
  id: string;
  name: string;
  description?: string;
  updated_at: string;
}

export interface chat_session {
  id: string;
  name: string;
  workflow_id?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview: string;
  last_message_date: string;
}

export interface default_chat_settings {
  id?: string;
  user_id?: string;
  system_prompt: string;
  response_style: 'conversational' | 'formal' | 'creative' | 'technical' | 'concise';
  temperature: number;
  max_tokens: number;
  context_window: number;
  enable_memory: boolean;
  enable_web_search: boolean;
  enable_code_execution: boolean;
  custom_instructions?: string;
  model_preference: string;
  created_at?: string;
  updated_at?: string;
}

export interface chat_handlers {
  load_workflows: () => Promise<void>;
  load_templates: () => Promise<void>;
  load_default_settings: () => Promise<void>;
  load_sessions: () => Promise<void>;
  handle_submit: (e: React.FormEvent) => Promise<void>;
  create_new_workflow: () => Promise<void>;
  create_from_template: (template_id: string, template_name: string) => Promise<void>;
  update_default_settings: (settings: Partial<default_chat_settings>) => Promise<void>;
  reset_default_settings: () => Promise<void>;
  load_session: (session_id: string) => Promise<void>;
  delete_session: (session_id: string) => Promise<void>;
  handle_key_down: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

export interface workflow_template {
  id: string;
  name: string;
  description: string;
  graph_data: Record<string, unknown>;
}

export interface workflow_limits {
  can_create: boolean;
  current_count: number;
  max_allowed: number;
  plan: string;
  is_unlimited: boolean;
}

export interface chat_state {
  messages: message[];
  input: string;
  loading: boolean;
  error: string | null;
  session_id: string;
  workflows: workflow[];
  selected_workflow: string | null;
  show_workflow_panel: boolean;
  show_templates: boolean;
  templates: Record<string, workflow_template>;
  show_new_workflow_modal: boolean;
  new_workflow_name: string;
  new_workflow_description: string;
  creating_workflow: boolean;
  default_settings: default_chat_settings | null;
  show_default_settings_modal: boolean;
  loading_default_settings: boolean;
  sessions: chat_session[];
  show_sessions_panel: boolean;
  loading_sessions: boolean;
  deleting_session: string | null;
}