import React from "react";
import { FileText, Plus, Edit } from "lucide-react";
import { workflow } from "../types";

interface workflow_panel_props {
  show_workflow_panel: boolean;
  workflows: workflow[];
  selected_workflow: string | null;
  set_selected_workflow: (id: string | null) => void;
  set_show_templates: (show: boolean) => void;
  set_show_new_workflow_modal: (show: boolean) => void;
}

export default function workflow_panel({
  show_workflow_panel,
  workflows,
  selected_workflow,
  set_selected_workflow,
  set_show_templates,
  set_show_new_workflow_modal
}: workflow_panel_props) {
  return (
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
                href={`/tools/chat/editor?id=${workflow.id}`}
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
  );
}