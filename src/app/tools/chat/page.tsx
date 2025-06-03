"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { MpContext } from "@/app/context/mp_context";
import { useAuth } from "@clerk/nextjs";
import { v4 as uuidv4 } from "uuid";

import { message, workflow, chat_state } from "./types";
import { create_chat_handlers } from "./handlers";
import {
  Error_display,
  Header,
  Input_area,
  Message_area,
  New_workflow_modal,
  Templates_modal,
  Workflow_panel
} from "./components"

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
    creating_workflow
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
    set_creating_workflow,
    set_show_templates
  };

  // Get handlers
  const handlers = create_chat_handlers(state, setters, refresh_mp);

  useEffect(() => {
    // Generate session ID on mount
    set_session_id(uuidv4());
    handlers.load_workflows();
    handlers.load_templates();
  }, []);

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
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header
          show_workflow_panel={show_workflow_panel}
          set_show_workflow_panel={set_show_workflow_panel}
        />

        {/* Messages Area */}
        <Message_area
          messages={messages}
          loading={loading}
          selected_workflow={selected_workflow}
          messages_end_ref={messages_end_ref}
        />

        {/* Error Display */}
        <Error_display error={error} />

        {/* Input Area */}
        <Input_area
          input={input}
          loading={loading}
          plan={plan}
          text_area_ref={text_area_ref}
          set_input={set_input}
          handle_submit={handlers.handle_submit}
          handle_key_down={handlers.handle_key_down}
        />
      </div>

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
        creating_workflow={creating_workflow}
        set_new_workflow_name={set_new_workflow_name}
        set_new_workflow_description={set_new_workflow_description}
        set_show_new_workflow_modal={set_show_new_workflow_modal}
        create_new_workflow={handlers.create_new_workflow}
      />
    </div>
  );
}