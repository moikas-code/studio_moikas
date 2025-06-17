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
    updated_at: new Date().toISOString(),
    status: "stable",
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
  const [new_workflow_name, set_new_workflow_name] = useState("");
  const [new_workflow_description, set_new_workflow_description] = useState("");
  const [new_workflow_status, set_new_workflow_status] = useState<
    "stable" | "early_access" | "experimental" | "deprecated"
  >("stable");
  const [creating_workflow, set_creating_workflow] = useState(false);
  const [loading_default_settings, set_loading_default_settings] = useState(false);
  const [loading_sessions, set_loading_sessions] = useState(false);
  const [deleting_session, set_deleting_session] = useState<string | null>(null);
  const [abortControllerRef] = useState<{ current: AbortController | null }>({ current: null });
  const message_container_ref = useRef<HTMLDivElement>(null!);
  const text_area_ref = useRef<HTMLTextAreaElement>(null!);

  const selected_workflow = workflows.find((w) => w.id === selected_workflow_id);

  // Create handlers using the factory function
  const handlers = useMemo(
    () =>
      create_chat_handlers({
        mp_tokens: mp_tokens || 0,
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
        show_defaults_modal,
        show_session_history,
        set_show_session_history,
        abortControllerRef,
        workflow_templates,
        set_workflow_templates,
        user_defaults,
        set_user_defaults,
        workflow_limits,
        set_workflow_limits,
        new_workflow_name,
        set_new_workflow_name,
        new_workflow_description,
        set_new_workflow_description,
        new_workflow_status,
        set_new_workflow_status,
        creating_workflow,
        set_creating_workflow,
        loading_default_settings,
        set_loading_default_settings,
        loading_sessions,
        set_loading_sessions,
        deleting_session,
        set_deleting_session,
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

  // Remove unused variables that were causing ESLint warnings

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
            loading={is_loading}
            selected_workflow={selected_workflow_id}
            messages_end_ref={message_container_ref}
          />

          {/* Input Area */}
          <InputArea
            input={input_message}
            loading={is_loading}
            plan={plan}
            text_area_ref={text_area_ref}
            set_input={set_input_message}
            handle_submit={handlers.handle_submit}
            handle_key_down={handlers.handle_key_down}
          />
        </div>

        {/* Side Panels */}
        <div className="lg:w-80 flex flex-col gap-4 overflow-hidden">
          {/* Workflow Panel */}
          <Workflow_panel
            show_workflow_panel={true}
            workflows={workflows}
            selected_workflow={selected_workflow_id}
            set_selected_workflow={(id) => id && set_selected_workflow_id(id)}
            set_show_templates={() => set_show_templates_modal(true)}
            set_show_new_workflow_modal={set_show_new_workflow_modal}
            workflow_limits={workflow_limits}
          />

          {/* Session History Panel */}
          {show_session_history && (
            <SessionHistoryPanel
              sessions={sessions}
              show_sessions_panel={show_session_history}
              loading_sessions={loading_sessions}
              deleting_session={deleting_session}
              current_session_id={current_session_id || ""}
              set_show_sessions_panel={set_show_session_history}
              load_session={async (session_id) => {
                set_current_session_id(session_id);
                const session = sessions.find((s) => s.id === session_id);
                if (session && session.workflow_id) {
                  set_selected_workflow_id(session.workflow_id);
                  await handlers.load_session_messages(session_id);
                }
              }}
              delete_session={handlers.delete_session}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {show_new_workflow_modal && (
        <New_workflow_modal
          show_new_workflow_modal={show_new_workflow_modal}
          new_workflow_name={new_workflow_name}
          new_workflow_description={new_workflow_description}
          new_workflow_status={new_workflow_status}
          creating_workflow={creating_workflow}
          set_new_workflow_name={set_new_workflow_name}
          set_new_workflow_description={set_new_workflow_description}
          set_new_workflow_status={set_new_workflow_status}
          set_show_new_workflow_modal={set_show_new_workflow_modal}
          create_new_workflow={handlers.create_new_workflow}
        />
      )}

      {show_templates_modal && (
        <Templates_modal
          show_templates={show_templates_modal}
          templates={workflow_templates.reduce(
            (acc, template) => {
              acc[template.id] = template;
              return acc;
            },
            {} as Record<string, workflow_template>
          )}
          create_from_template={handlers.create_from_template}
          set_show_templates={set_show_templates_modal}
        />
      )}

      {show_defaults_modal && (
        <DefaultSettingsModal
          is_open={show_defaults_modal}
          current_settings={user_defaults}
          loading={loading_default_settings}
          on_close={() => set_show_defaults_modal(false)}
          on_save={handlers.update_default_settings}
          on_reset={handlers.reset_default_settings}
        />
      )}
    </div>
  );
}
