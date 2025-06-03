import { v4 as uuidv4 } from "uuid";
import { message, workflow, chat_state } from "./types";

export const create_chat_handlers = (
  state: chat_state,
  setters: {
    set_messages: React.Dispatch<React.SetStateAction<message[]>>;
    set_input: React.Dispatch<React.SetStateAction<string>>;
    set_loading: React.Dispatch<React.SetStateAction<boolean>>;
    set_error: React.Dispatch<React.SetStateAction<string | null>>;
    set_workflows: React.Dispatch<React.SetStateAction<workflow[]>>;
    set_selected_workflow: React.Dispatch<React.SetStateAction<string | null>>;
    set_templates: React.Dispatch<React.SetStateAction<any>>;
    set_show_new_workflow_modal: React.Dispatch<React.SetStateAction<boolean>>;
    set_new_workflow_name: React.Dispatch<React.SetStateAction<string>>;
    set_new_workflow_description: React.Dispatch<React.SetStateAction<string>>;
    set_creating_workflow: React.Dispatch<React.SetStateAction<boolean>>;
    set_show_templates: React.Dispatch<React.SetStateAction<boolean>>;
  },
  refresh_mp: () => void
) => {
  const load_workflows = async () => {
    try {
      const response = await fetch("/api/memu/workflows");
      if (response.ok) {
        const data = await response.json();
        setters.set_workflows(data.workflows || []);
      }
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  };

  const load_templates = async () => {
    try {
      const response = await fetch("/api/memu/templates");
      if (response.ok) {
        const data = await response.json();
        setters.set_templates(data.templates || {});
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.input.trim() || state.loading) return;
    
    const user_message: message = {
      id: uuidv4(),
      role: "user",
      content: state.input.trim(),
      created_at: new Date().toISOString()
    };
    
    setters.set_messages(prev => [...prev, user_message]);
    setters.set_input("");
    setters.set_loading(true);
    setters.set_error(null);
    
    try {
      const response = await fetch("/api/memu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: state.session_id,
          workflow_id: state.selected_workflow,
          message: user_message.content
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }
      
      const assistant_message: message = {
        id: uuidv4(),
        role: "assistant",
        content: data.response,
        created_at: new Date().toISOString()
      };
      
      setters.set_messages(prev => [...prev, assistant_message]);
      
      if (data.tokens_used) {
        refresh_mp();
        
        if (data.token_details) {
          console.log("Token usage:", data.token_details);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setters.set_error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setters.set_loading(false);
    }
  };

  const create_new_workflow = async () => {
    if (!state.new_workflow_name.trim()) return;
    
    setters.set_creating_workflow(true);
    try {
      const response = await fetch("/api/memu/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: state.new_workflow_name.trim(),
          description: state.new_workflow_description.trim() || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        await load_workflows();
        setters.set_selected_workflow(data.workflow.id);
        setters.set_show_new_workflow_modal(false);
        setters.set_new_workflow_name("");
        setters.set_new_workflow_description("");
      } else {
        const error_data = await response.json();
        setters.set_error(error_data.error || "Failed to create workflow");
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
      setters.set_error("Failed to create workflow");
    } finally {
      setters.set_creating_workflow(false);
    }
  };

  const create_from_template = async (template_id: string, template_name: string) => {
    try {
      const response = await fetch("/api/memu/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          template_id,
          workflow_name: `${template_name} - ${new Date().toLocaleDateString()}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        await load_workflows();
        setters.set_selected_workflow(data.workflow.id);
        setters.set_show_templates(false);
      }
    } catch (error) {
      console.error("Failed to create from template:", error);
    }
  };

  const handle_key_down = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handle_submit(e as any);
    }
  };

  return {
    load_workflows,
    load_templates,
    handle_submit,
    create_new_workflow,
    create_from_template,
    handle_key_down
  };
};