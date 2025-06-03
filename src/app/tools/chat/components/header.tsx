import React from "react";
import { Workflow } from "lucide-react";
import Token_count_display from "@/app/components/TokenCountDisplay";

interface header_props {
  show_workflow_panel: boolean;
  set_show_workflow_panel: (show: boolean) => void;
}

export default function header({ 
  show_workflow_panel, 
  set_show_workflow_panel 
}: header_props) {
  return (
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
  );
}