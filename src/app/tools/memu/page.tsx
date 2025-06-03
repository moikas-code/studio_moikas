"use client";

import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { MpContext } from "@/app/context/mp_context";
import { v4 as uuidv4 } from "uuid";

import { message, workflow, chat_state, default_chat_settings, chat_session, workflow_template, workflow_limits } from "./types";
import { create_chat_handlers } from "./handlers";
import {
  Error_display,
  Header,
  InputArea,
  MessageArea,
  New_workflow_modal,
  Templates_modal,
  Workflow_panel
} from "./components";
import DefaultSettingsModal from "./components/default_settings_modal";
import SessionHistoryPanel from "./components/session_history_panel";

export default function Workflow_chatbot_page() {
  const { refresh_mp, plan } = useContext(MpContext);
  
  const [messages, set_messages] = useState<message[]>([]);
  const [input, set_input] = useState("");
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [session_id, set_session_id] = useState<string>("");
  const [workflows, set_workflows] = useState<workflow[]>([]);
  const [selected_workflow, set_selected_workflow] = useState<string | null>(null);
  const [show_workflow_panel, set_show_workflow_panel] = useState(false);
  const [show_templates, set_show_templates] = useState(false);
  const [templates, set_templates] = useState<Record<string, workflow_template>>({});
  const [show_new_workflow_modal, set_show_new_workflow_modal] = useState(false);
  const [new_workflow_name, set_new_workflow_name] = useState("");
  const [new_workflow_description, set_new_workflow_description] = useState("");
  const [new_workflow_status, set_new_workflow_status] = useState<'stable' | 'early_access' | 'experimental' | 'deprecated'>('stable');
  const [creating_workflow, set_creating_workflow] = useState(false);
  const [workflow_limits, set_workflow_limits] = useState<workflow_limits | null>(null);
  const [default_settings, set_default_settings] = useState<default_chat_settings | null>(null);
  const [show_default_settings_modal, set_show_default_settings_modal] = useState(false);
  const [loading_default_settings, set_loading_default_settings] = useState(false);
  
  // Session management state
  const [sessions, set_sessions] = useState<chat_session[]>([]);
  const [show_sessions_panel, set_show_sessions_panel] = useState(false);
  const [loading_sessions, set_loading_sessions] = useState(false);
  const [deleting_session, set_deleting_session] = useState<string | null>(null);
  
  const messages_end_ref = useRef<HTMLDivElement>(null);
  const text_area_ref = useRef<HTMLTextAreaElement>(null);

  // Create state object for handlers
  const state: chat_state = {
    messages,
    input,
    loading,
    error,
    session_id,
    workflows,
    selected_workflow,
    show_workflow_panel,
    show_templates,
    templates,
    show_new_workflow_modal,
    new_workflow_name,
    new_workflow_description,
    new_workflow_status,
    creating_workflow,
    default_settings,
    show_default_settings_modal,
    loading_default_settings,
    sessions,
    show_sessions_panel,
    loading_sessions,
    deleting_session
  };

  // Create setters object for handlers
  const setters = {
    set_messages,
    set_input,
    set_loading,
    set_error,
    set_workflows,
    set_selected_workflow,
    set_templates,
    set_show_new_workflow_modal,
    set_new_workflow_name,
    set_new_workflow_description,
    set_new_workflow_status,
    set_creating_workflow,
    set_show_templates,
    set_workflow_limits,
    set_default_settings,
    set_show_default_settings_modal,
    set_loading_default_settings,
    set_sessions,
    set_show_sessions_panel,
    set_loading_sessions,
    set_deleting_session,
    set_session_id
  };

  // Get handlers with useMemo to prevent recreating on every render
  const handlers = useMemo(() => create_chat_handlers(state, setters, refresh_mp),
    // Only recreate handlers when refresh_mp changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [refresh_mp]
  );

  useEffect(() => {
    // Generate session ID on mount
    set_session_id(uuidv4());
    handlers.load_workflows();
    handlers.load_templates();
    handlers.load_workflow_limits();
    handlers.load_default_settings();
  }, [handlers]);

  useEffect(() => {
    // Scroll to bottom when messages update
    messages_end_ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-screen flex">
      {/* Workflow Panel */}
      <Workflow_panel
        show_workflow_panel={show_workflow_panel}
        workflows={workflows}
        selected_workflow={selected_workflow}
        set_selected_workflow={set_selected_workflow}
        set_show_templates={set_show_templates}
        set_show_new_workflow_modal={set_show_new_workflow_modal}
        workflow_limits={workflow_limits}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Early Access Banner */}
        <div className="bg-warning/10 border-l-4 border-warning px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="badge badge-warning badge-sm gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Early Access
            </div>
            <span className="text-sm text-warning-content/80">
              MEMU Workflow Chat is in early access. You may experience bugs or incomplete features.
            </span>
          </div>
        </div>
        {/* Header */}
        <Header
          show_workflow_panel={show_workflow_panel}
          set_show_workflow_panel={set_show_workflow_panel}
          set_show_default_settings_modal={set_show_default_settings_modal}
          show_sessions_panel={show_sessions_panel}
          set_show_sessions_panel={set_show_sessions_panel}
          load_sessions={handlers.load_sessions}
        />

        {/* Messages Area */}
        <MessageArea
          messages={messages}
          loading={loading}
          selected_workflow={selected_workflow}
          messages_end_ref={messages_end_ref as React.RefObject<HTMLDivElement>}
        />

        {/* Error Display */}
        <Error_display error={error} />

        {/* Input Area */}
        <InputArea
          input={input}
          loading={loading}
          plan={plan}
          text_area_ref={text_area_ref as React.RefObject<HTMLTextAreaElement>}
          set_input={set_input}
          handle_submit={handlers.handle_submit}
          handle_key_down={handlers.handle_key_down}
        />
      </div>

      {/* Session History Panel */}
      <SessionHistoryPanel
        sessions={sessions}
        show_sessions_panel={show_sessions_panel}
        loading_sessions={loading_sessions}
        deleting_session={deleting_session}
        current_session_id={session_id}
        set_show_sessions_panel={set_show_sessions_panel}
        load_session={handlers.load_session}
        delete_session={handlers.delete_session}
      />

      {/* Templates Modal */}
      <Templates_modal
        show_templates={show_templates}
        templates={templates}
        create_from_template={handlers.create_from_template}
        set_show_templates={set_show_templates}
      />

      {/* New Workflow Modal */}
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

      {/* Default Settings Modal */}
      <DefaultSettingsModal
        is_open={show_default_settings_modal}
        current_settings={default_settings}
        loading={loading_default_settings}
        on_close={() => set_show_default_settings_modal(false)}
        on_save={handlers.update_default_settings}
        on_reset={handlers.reset_default_settings}
      />
    </div>
  );
}