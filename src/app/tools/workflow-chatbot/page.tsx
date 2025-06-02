"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { MpContext } from "@/app/context/mp_context";
import { useAuth } from "@clerk/nextjs";
import Token_count_display from "@/app/components/TokenCountDisplay";
import { v4 as uuidv4 } from "uuid";
import { Send, Bot, User, Workflow, Plus, Settings, Edit, FileText } from "lucide-react";

interface message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

interface workflow {
  id: string;
  name: string;
  description?: string;
  updated_at: string;
}

export default function Workflow_chatbot_page() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  const { userId } = useAuth();
  
  const [messages, set_messages] = useState<message[]>([]);
  const [input, set_input] = useState("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [session_id, set_session_id] = useState<string>("");
  const [workflows, set_workflows] = useState<workflow[]>([]);
  const [selected_workflow, set_selected_workflow] = useState<string | null>(null);
  const [show_workflow_panel, set_show_workflow_panel] = useState(false);
  const [show_templates, set_show_templates] = useState(false);
  const [templates, set_templates] = useState<any>({});
  const [show_new_workflow_modal, set_show_new_workflow_modal] = useState(false);
  const [new_workflow_name, set_new_workflow_name] = useState("");
  const [new_workflow_description, set_new_workflow_description] = useState("");
  const [creating_workflow, set_creating_workflow] = useState(false);
  
  const messages_end_ref = useRef<HTMLDivElement>(null);
  const text_area_ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Generate session ID on mount
    set_session_id(uuidv4());
    load_workflows();
    load_templates();
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages update
    messages_end_ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const load_workflows = async () => {
    try {
      const response = await fetch("/api/workflow-chatbot");
      if (response.ok) {
        const data = await response.json();
        set_workflows(data.workflows || []);
      }
    } catch (error) {
      console.error("Failed to load workflows:", error);
    }
  };

  const load_templates = async () => {
    try {
      const response = await fetch("/api/workflow-chatbot/templates");
      if (response.ok) {
        const data = await response.json();
        set_templates(data.grouped_templates || {});
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const handle_submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || loading) return;
    
    const user_message: message = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString()
    };
    
    set_messages(prev => [...prev, user_message]);
    set_input("");
    set_loading(true);
    set_error(null);
    
    try {
      const response = await fetch("/api/workflow-chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id,
          workflow_id: selected_workflow,
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
      
      set_messages(prev => [...prev, assistant_message]);
      
      // Refresh token count
      if (data.tokens_used) {
        refresh_mp();
        
        // Show token details in console for debugging
        if (data.token_details) {
          console.log("Token usage:", data.token_details);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      set_error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      set_loading(false);
    }
  };

  const create_new_workflow = async () => {
    if (!new_workflow_name.trim()) return;
    
    set_creating_workflow(true);
    try {
      const response = await fetch("/api/workflow-chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: new_workflow_name.trim(),
          description: new_workflow_description.trim() || null
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        await load_workflows();
        set_selected_workflow(data.workflow.id);
        set_show_new_workflow_modal(false);
        set_new_workflow_name("");
        set_new_workflow_description("");
      } else {
        const error_data = await response.json();
        set_error(error_data.error || "Failed to create workflow");
      }
    } catch (error) {
      console.error("Failed to create workflow:", error);
      set_error("Failed to create workflow");
    } finally {
      set_creating_workflow(false);
    }
  };

  const create_from_template = async (template_id: string, template_name: string) => {
    try {
      const response = await fetch("/api/workflow-chatbot/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          template_id,
          name: `${template_name} - ${new Date().toLocaleDateString()}`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        await load_workflows();
        set_selected_workflow(data.workflow.id);
        set_show_templates(false);
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

  return (
    <div className="h-screen flex">
      {/* Workflow Panel */}
      <div className={`${show_workflow_panel ? "w-64" : "w-0"} transition-all duration-300 bg-base-200 overflow-hidden`}>
        <div className="p-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Workflows</h3>
            <div className="flex gap-1">
              <button
                onClick={() => set_show_templates(true)}
                className="btn btn-sm btn-circle btn-ghost"
                title="Browse templates"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={() => set_show_new_workflow_modal(true)}
                className="btn btn-sm btn-circle btn-ghost"
                title="Create new workflow"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={() => set_selected_workflow(null)}
              className={`w-full text-left p-2 rounded ${!selected_workflow ? "bg-primary text-primary-content" : "hover:bg-base-300"}`}
            >
              Default Chat
            </button>
            
            {workflows.map(workflow => (
              <div
                key={workflow.id}
                className={`group flex items-center gap-2 p-2 rounded ${selected_workflow === workflow.id ? "bg-primary text-primary-content" : "hover:bg-base-300"}`}
              >
                <button
                  onClick={() => set_selected_workflow(workflow.id)}
                  className="flex-1 text-left"
                >
                  <div className="font-medium">{workflow.name}</div>
                  {workflow.description && (
                    <div className="text-xs opacity-70">{workflow.description}</div>
                  )}
                </button>
                <a
                  href={`/tools/workflow-chatbot/editor?id=${workflow.id}`}
                  className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit workflow"
                >
                  <Edit className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="navbar bg-base-100 border-b">
          <div className="flex-none">
            <button
              onClick={() => set_show_workflow_panel(!show_workflow_panel)}
              className="btn btn-square btn-ghost"
            >
              <Workflow className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Workflow Chatbot</h1>
          </div>
          <div className="flex-none">
            <Token_count_display />
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-base-content/60">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Start a conversation</p>
                <p className="text-sm mt-2">
                  {selected_workflow 
                    ? "Using custom workflow"
                    : "Ask anything or create a workflow to get started"}
                </p>
              </div>
            )}
            
            {messages.map(message => (
              <div
                key={message.id}
                className={`chat ${message.role === "user" ? "chat-end" : "chat-start"}`}
              >
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full bg-base-300 flex items-center justify-center">
                    {message.role === "user" ? (
                      <User className="w-6 h-6" />
                    ) : (
                      <Bot className="w-6 h-6" />
                    )}
                  </div>
                </div>
                <div className={`chat-bubble ${message.role === "user" ? "chat-bubble-primary" : ""}`}>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="chat chat-start">
                <div className="chat-image avatar">
                  <div className="w-10 rounded-full bg-base-300 flex items-center justify-center">
                    <Bot className="w-6 h-6" />
                  </div>
                </div>
                <div className="chat-bubble">
                  <span className="loading loading-dots loading-sm"></span>
                </div>
              </div>
            )}
            
            <div ref={messages_end_ref} />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4">
            <div className="alert alert-error max-w-4xl mx-auto">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <form onSubmit={handle_submit} className="p-4 border-t bg-base-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <textarea
                ref={text_area_ref}
                value={input}
                onChange={(e) => set_input(e.target.value)}
                onKeyDown={handle_key_down}
                placeholder="Type your message..."
                className="textarea textarea-bordered flex-1 resize-none"
                rows={2}
                disabled={loading}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !input.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-base-content/60 mt-2">
              {plan === "free" ? "10 messages/minute" : "60 messages/minute"} • 1 MP per 3000 tokens (min 1 MP)
            </div>
          </div>
        </form>
      </div>

      {/* Templates Modal */}
      {show_templates && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-4">Workflow Templates</h3>
            
            <div className="space-y-6">
              {Object.entries(templates).map(([category, category_templates]: [string, any]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold uppercase text-base-content/60 mb-2">
                    {category.replace("_", " ")}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category_templates.map((template: any) => (
                      <div
                        key={template.id}
                        className="card bg-base-200 hover:bg-base-300 cursor-pointer transition-colors"
                        onClick={() => create_from_template(template.id, template.name)}
                      >
                        <div className="card-body p-4">
                          <h5 className="card-title text-base">{template.name}</h5>
                          {template.description && (
                            <p className="text-sm text-base-content/70">{template.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="modal-action">
              <button onClick={() => set_show_templates(false)} className="btn">
                Cancel
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => set_show_templates(false)} />
        </div>
      )}

      {/* New Workflow Modal */}
      {show_new_workflow_modal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New Workflow</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Workflow Name</span>
                </label>
                <input
                  type="text"
                  placeholder="My Awesome Workflow"
                  className="input input-bordered w-full"
                  value={new_workflow_name}
                  onChange={(e) => set_new_workflow_name(e.target.value)}
                  autoFocus
                />
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description (optional)</span>
                </label>
                <textarea
                  placeholder="What does this workflow do?"
                  className="textarea textarea-bordered w-full"
                  rows={3}
                  value={new_workflow_description}
                  onChange={(e) => set_new_workflow_description(e.target.value)}
                />
              </div>
            </div>
            
            <div className="modal-action">
              <button 
                onClick={() => {
                  set_show_new_workflow_modal(false);
                  set_new_workflow_name("");
                  set_new_workflow_description("");
                }} 
                className="btn"
                disabled={creating_workflow}
              >
                Cancel
              </button>
              <button 
                onClick={create_new_workflow} 
                className="btn btn-primary"
                disabled={!new_workflow_name.trim() || creating_workflow}
              >
                {creating_workflow ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  "Create Workflow"
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => {
            set_show_new_workflow_modal(false);
            set_new_workflow_name("");
            set_new_workflow_description("");
          }} />
        </div>
      )}
    </div>
  );
}