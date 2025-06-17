"use client";

import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { MpContext } from "@/context/mp_context";
import { v4 as uuidv4 } from "uuid";

import {
  message,
  workflow,
  default_chat_settings,
  chat_session,
  workflow_template,
  workflow_limits,
} from "./types";
import { create_chat_handlers } from "./handlers";
import {
  Error_display,
  Header,
  InputArea,
  MessageArea,
  New_workflow_modal,
  Templates_modal,
  Workflow_panel,
} from "./components";
import DefaultSettingsModal from "./components/default_settings_modal";
import SessionHistoryPanel from "./components/session_history_panel";

// Default workflows
const DEFAULT_WORKFLOWS: workflow[] = [
  {
    id: uuidv4(),
    name: "General Chat",
    description: "A versatile AI assistant for general conversation",
    max_messages: 50,
    max_tokens: 4000,
    temperature: 0.7,
    system_prompt: "You are a helpful, creative, and friendly AI assistant.",
    tool_choice: "auto",
    tools: ["llm"],
    allow_parallel: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_template: true,
    status: "active",
  },
];

export default function MeMusClient() {
  const { mp_tokens, refresh_mp, plan } = useContext(MpContext);
  const [workflows, set_workflows] = useState<workflow[]>(DEFAULT_WORKFLOWS);
  const [selected_workflow_id, set_selected_workflow_id] = useState<string>(
    DEFAULT_WORKFLOWS[0].id
  );
  const [current_session_id, set_current_session_id] = useState<string | null>(null);
  const [sessions, set_sessions] = useState<chat_session[]>([]);
  const [messages, set_messages] = useState<message[]>([]);
  const [input_message, set_input_message] = useState("");
  const [is_loading, set_is_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [show_new_workflow_modal, set_show_new_workflow_modal] = useState(false);
  const [show_templates_modal, set_show_templates_modal] = useState(false);
  const [show_defaults_modal, set_show_defaults_modal] = useState(false);
  const [show_session_history, set_show_session_history] = useState(false);
  const [workflow_templates, set_workflow_templates] = useState<workflow_template[]>([]);
  const [user_defaults, set_user_defaults] = useState<default_chat_settings | null>(null);
  const [workflow_limits, set_workflow_limits] = useState<workflow_limits | null>(null);
  const [abortControllerRef] = useState<{ current: AbortController | null }>({ current: null });
  const message_container_ref = useRef<HTMLDivElement>(null);

  const selected_workflow = workflows.find((w) => w.id === selected_workflow_id);

  // Create handlers using the factory function
  const handlers = useMemo(
    () =>
      create_chat_handlers({
        mp_tokens,
        refresh_mp,
        workflows,
        set_workflows,
        selected_workflow_id,
        set_selected_workflow_id,
        current_session_id,
        set_current_session_id,
        sessions,
        set_sessions,
        messages,
        set_messages,
        input_message,
        set_input_message,
        is_loading,
        set_is_loading,
        error,
        set_error,
        show_new_workflow_modal,
        set_show_new_workflow_modal,
        show_templates_modal,
        set_show_templates_modal,
        abortControllerRef,
        workflow_templates,
        set_workflow_templates,
        user_defaults,
        set_user_defaults,
        workflow_limits,
        set_workflow_limits,
        abortControllerRef,
        message_container_ref,
        plan: plan || "free",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mp_tokens,
      refresh_mp,
      workflows,
      selected_workflow_id,
      current_session_id,
      sessions,
      messages,
      input_message,
      is_loading,
      error,
      workflow_templates,
      user_defaults,
      workflow_limits,
      plan,
    ]
  );

  // Load workflows and templates on mount
  useEffect(() => {
    handlers.fetch_workflows();
    handlers.fetch_templates();
    handlers.fetch_user_defaults();
    handlers.fetch_workflow_limits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create or load session when workflow changes
  useEffect(() => {
    if (selected_workflow_id) {
      // Check if there's an existing session for this workflow
      const existing_session = sessions.find((s) => s.workflow_id === selected_workflow_id);
      if (existing_session) {
        set_current_session_id(existing_session.id);
        handlers.load_session_messages(existing_session.id);
      } else {
        // Create new session
        handlers.create_new_session();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected_workflow_id]);

  const message_count = messages.filter((m) => m.role === "user").length;
  const is_at_message_limit =
    selected_workflow && message_count >= (selected_workflow.max_messages || 50);

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden">
      <div className="h-full flex flex-col lg:flex-row gap-6">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Header */}
          <Header
            selected_workflow={selected_workflow}
            on_workflow_settings={() => set_show_new_workflow_modal(true)}
            on_new_workflow={() => {
              set_show_new_workflow_modal(true);
            }}
            on_new_session={handlers.create_new_session}
            on_view_templates={() => set_show_templates_modal(true)}
            on_default_settings={() => set_show_defaults_modal(true)}
            on_view_history={() => set_show_session_history(!show_session_history)}
            show_history={show_session_history}
          />

          {error && <Error_display error={error} on_dismiss={() => set_error(null)} />}

          {/* Messages Area */}
          <MessageArea
            messages={messages}
            is_loading={is_loading}
            message_container_ref={message_container_ref}
            on_regenerate={handlers.regenerate_message}
            on_edit={(message_id, new_content) => handlers.edit_message(message_id, new_content)}
          />

          {/* Input Area */}
          <InputArea
            input_message={input_message}
            set_input_message={set_input_message}
            is_loading={is_loading}
            is_at_message_limit={is_at_message_limit}
            on_send={handlers.send_message}
            on_stop={() => {
              if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                set_is_loading(false);
              }
            }}
            tokens_used={handlers.calculate_tokens_used()}
            max_tokens={selected_workflow?.max_tokens || 4000}
          />
        </div>

        {/* Side Panels */}
        <div className="lg:w-80 flex flex-col gap-4 overflow-hidden">
          {/* Workflow Panel */}
          <Workflow_panel
            workflows={workflows}
            selected_workflow_id={selected_workflow_id}
            on_select_workflow={set_selected_workflow_id}
            on_edit_workflow={(workflow_id) => {
              const workflow = workflows.find((w) => w.id === workflow_id);
              if (workflow) {
                set_show_new_workflow_modal(true);
              }
            }}
            on_delete_workflow={handlers.delete_workflow}
            on_export_workflow={handlers.export_workflow}
            on_create_new={() => set_show_new_workflow_modal(true)}
          />

          {/* Session History Panel */}
          {show_session_history && (
            <SessionHistoryPanel
              sessions={sessions}
              current_session_id={current_session_id}
              on_select_session={(session_id) => {
                set_current_session_id(session_id);
                const session = sessions.find((s) => s.id === session_id);
                if (session) {
                  set_selected_workflow_id(session.workflow_id);
                  handlers.load_session_messages(session_id);
                }
              }}
              on_delete_session={handlers.delete_session}
              on_close={() => set_show_session_history(false)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {show_new_workflow_modal && (
        <New_workflow_modal
          workflow={workflows.find((w) => w.id === selected_workflow_id)}
          user_defaults={user_defaults}
          workflow_limits={workflow_limits}
          on_save={handlers.save_workflow}
          on_close={() => set_show_new_workflow_modal(false)}
        />
      )}

      {show_templates_modal && (
        <Templates_modal
          templates={workflow_templates}
          on_select={handlers.create_workflow_from_template}
          on_close={() => set_show_templates_modal(false)}
        />
      )}

      {show_defaults_modal && (
        <DefaultSettingsModal
          defaults={user_defaults}
          on_save={handlers.save_user_defaults}
          on_close={() => set_show_defaults_modal(false)}
        />
      )}
    </div>
  );
}
