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

export interface chat_handlers {
  load_workflows: () => Promise<void>;
  load_templates: () => Promise<void>;
  handle_submit: (e: React.FormEvent) => Promise<void>;
  create_new_workflow: () => Promise<void>;
  create_from_template: (template_id: string, template_name: string) => Promise<void>;
  handle_key_down: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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
  templates: any;
  show_new_workflow_modal: boolean;
  new_workflow_name: string;
  new_workflow_description: string;
  creating_workflow: boolean;
}