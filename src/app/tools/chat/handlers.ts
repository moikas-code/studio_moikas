import { v4 as uuidv4 } from "uuid";
import { message, workflow, chat_state, default_chat_settings, chat_session } from "./types";

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
    set_workflow_limits: React.Dispatch<React.SetStateAction<any>>;
    set_default_settings: React.Dispatch<React.SetStateAction<default_chat_settings | null>>;
    set_show_default_settings_modal: React.Dispatch<React.SetStateAction<boolean>>;
    set_loading_default_settings: React.Dispatch<React.SetStateAction<boolean>>;
    set_sessions: React.Dispatch<React.SetStateAction<chat_session[]>>;
    set_show_sessions_panel: React.Dispatch<React.SetStateAction<boolean>>;
    set_loading_sessions: React.Dispatch<React.SetStateAction<boolean>>;
    set_deleting_session: React.Dispatch<React.SetStateAction<string | null>>;
    set_session_id: React.Dispatch<React.SetStateAction<string>>;
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

  const load_workflow_limits = async () => {
    try {
      const response = await fetch("/api/memu/workflows/limits");
      if (response.ok) {
        const data = await response.json();
        setters.set_workflow_limits(data);
      }
    } catch (error) {
      console.error("Failed to load workflow limits:", error);
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
        await load_workflow_limits(); // Refresh limits after creating workflow
        setters.set_selected_workflow(data.workflow.id);
        setters.set_show_new_workflow_modal(false);
        setters.set_new_workflow_name("");
        setters.set_new_workflow_description("");
      } else {
        const error_data = await response.json();
        if (response.status === 403 && error_data.limit_info) {
          // Handle workflow limit error specifically
          setters.set_error(error_data.error || "Workflow limit reached");
        } else {
          setters.set_error(error_data.error || "Failed to create workflow");
        }
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
        await load_workflow_limits(); // Refresh limits after creating workflow from template
        setters.set_selected_workflow(data.workflow.id);
        setters.set_show_templates(false);
      } else {
        const error_data = await response.json();
        if (response.status === 403 && error_data.limit_info) {
          // Handle workflow limit error specifically
          setters.set_error(error_data.error || "Workflow limit reached");
        } else {
          setters.set_error(error_data.error || "Failed to create workflow from template");
        }
        setters.set_show_templates(false);
      }
    } catch (error) {
      console.error("Failed to create from template:", error);
      setters.set_error("Failed to create workflow from template");
    }
  };

  const load_default_settings = async () => {
    setters.set_loading_default_settings(true);
    try {
      const response = await fetch("/api/memu/defaults");
      if (response.ok) {
        const data = await response.json();
        setters.set_default_settings(data.defaults || null);
      } else if (response.status === 404) {
        // API endpoint not found, use fallback defaults
        console.log("Default settings API not available, using fallback defaults");
        const fallback_defaults = {
          system_prompt: "You are a helpful AI assistant.",
          response_style: "conversational" as const,
          temperature: 0.7,
          max_tokens: 2048,
          context_window: 10,
          enable_memory: true,
          enable_web_search: false,
          enable_code_execution: false,
          model_preference: "grok-2-mini-latest"
        };
        setters.set_default_settings(fallback_defaults);
      } else {
        console.error("Failed to load default settings:", response.status, response.statusText);
        // Still set fallback defaults on other errors
        const fallback_defaults = {
          system_prompt: "You are a helpful AI assistant.",
          response_style: "conversational" as const,
          temperature: 0.7,
          max_tokens: 2048,
          context_window: 10,
          enable_memory: true,
          enable_web_search: false,
          enable_code_execution: false,
          model_preference: "grok-2-mini-latest"
        };
        setters.set_default_settings(fallback_defaults);
      }
    } catch (error) {
      console.error("Failed to load default settings:", error);
      // Use fallback defaults on network/fetch errors
      const fallback_defaults = {
        system_prompt: "You are a helpful AI assistant.",
        response_style: "conversational" as const,
        temperature: 0.7,
        max_tokens: 2048,
        context_window: 10,
        enable_memory: true,
        enable_web_search: false,
        enable_code_execution: false,
        model_preference: "grok-2-mini-latest"
      };
      setters.set_default_settings(fallback_defaults);
    } finally {
      setters.set_loading_default_settings(false);
    }
  };

  const update_default_settings = async (settings: Partial<default_chat_settings>) => {
    try {
      const response = await fetch("/api/memu/defaults", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        const data = await response.json();
        setters.set_default_settings(data.defaults);
        console.log("Default settings updated successfully");
      } else if (response.status === 404) {
        // API endpoint not available, just update local state
        console.log("Default settings API not available, updating local state only");
        setters.set_default_settings(prev => prev ? { ...prev, ...settings } : null);
        setters.set_error("Settings updated locally. Full persistence requires database setup.");
      } else {
        const error_data = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(error_data.error || "Failed to update default settings");
      }
    } catch (error) {
      console.error("Failed to update default settings:", error);
      if (error instanceof TypeError && error.message.includes("fetch")) {
        // Network error, update local state
        setters.set_default_settings(prev => prev ? { ...prev, ...settings } : null);
        setters.set_error("Settings updated locally. Network error prevented server update.");
      } else {
        setters.set_error(error instanceof Error ? error.message : "Failed to update default settings");
        throw error;
      }
    }
  };

  const reset_default_settings = async () => {
    try {
      const response = await fetch("/api/memu/defaults", {
        method: "DELETE"
      });
      
      if (response.ok) {
        // Reload default settings to get the system defaults
        await load_default_settings();
        console.log("Default settings reset successfully");
      } else {
        const error_data = await response.json();
        throw new Error(error_data.error || "Failed to reset default settings");
      }
    } catch (error) {
      console.error("Failed to reset default settings:", error);
      setters.set_error(error instanceof Error ? error.message : "Failed to reset default settings");
      throw error;
    }
  };

  const load_sessions = async () => {
    setters.set_loading_sessions(true);
    try {
      const response = await fetch("/api/memu/sessions");
      if (response.ok) {
        const data = await response.json();
        setters.set_sessions(data.sessions || []);
      } else {
        console.error("Failed to load sessions:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load sessions:", error);
    } finally {
      setters.set_loading_sessions(false);
    }
  };

  const load_session = async (session_id: string) => {
    try {
      setters.set_session_id(session_id);
      setters.set_messages([]);
      setters.set_show_sessions_panel(false);
      
      // Fetch messages for the session
      const response = await fetch(`/api/memu?session_id=${session_id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.messages) {
          setters.set_messages(data.messages);
        }
      } else {
        console.error("Failed to load session messages:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to load session:", error);
      setters.set_error("Failed to load session");
    }
  };

  const delete_session = async (session_id: string) => {
    setters.set_deleting_session(session_id);
    try {
      const response = await fetch(`/api/memu/sessions?session_id=${session_id}`, {
        method: "DELETE"
      });
      
      if (response.ok) {
        // Remove from local state
        setters.set_sessions(prev => prev.filter(s => s.id !== session_id));
        
        // If we're deleting the current session, start a new one
        if (state.session_id === session_id) {
          const new_session_id = uuidv4();
          setters.set_session_id(new_session_id);
          setters.set_messages([]);
        }
      } else {
        const error_data = await response.json();
        setters.set_error(error_data.error || "Failed to delete session");
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      setters.set_error("Failed to delete session");
    } finally {
      setters.set_deleting_session(null);
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
    load_workflow_limits,
    load_default_settings,
    load_sessions,
    handle_submit,
    create_new_workflow,
    create_from_template,
    update_default_settings,
    reset_default_settings,
    load_session,
    delete_session,
    handle_key_down
  };
};