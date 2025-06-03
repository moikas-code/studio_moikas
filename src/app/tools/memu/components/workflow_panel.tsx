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
  workflow_limits?: {
    current_count: number;
    max_allowed: number;
    can_create: boolean;
    plan: string;
    is_unlimited: boolean;
  };
}

export default function workflow_panel({
  show_workflow_panel,
  workflows,
  selected_workflow,
  set_selected_workflow,
  set_show_templates,
  set_show_new_workflow_modal,
  workflow_limits
}: workflow_panel_props) {
  return (
    <div className={`${show_workflow_panel ? "w-64" : "w-0"} transition-all duration-300 bg-base-200 overflow-hidden`}>
      <div className="p-4 h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Workflows</h3>
          <div className="flex gap-1">
            <button
              onClick={() => set_show_templates(true)}
              className={`btn btn-sm btn-circle btn-ghost ${!workflow_limits?.can_create ? "btn-disabled" : ""}`}
              title={workflow_limits?.can_create ? "Browse templates" : "Workflow limit reached"}
              disabled={!workflow_limits?.can_create}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => set_show_new_workflow_modal(true)}
              className={`btn btn-sm btn-circle btn-ghost ${!workflow_limits?.can_create ? "btn-disabled" : ""}`}
              title={workflow_limits?.can_create ? "Create new workflow" : "Workflow limit reached"}
              disabled={!workflow_limits?.can_create}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Workflow Limits Info */}
        {workflow_limits && (
          <div className="mb-4 p-2 bg-base-300 rounded text-xs">
            <div className="flex justify-between items-center">
              <span>Workflows:</span>
              <span className="font-medium">
                {workflow_limits.is_unlimited 
                  ? `${workflow_limits.current_count} (Unlimited)`
                  : `${workflow_limits.current_count}/${workflow_limits.max_allowed}`
                }
              </span>
            </div>
            {!workflow_limits.can_create && workflow_limits.plan === "free" && (
              <div className="mt-1 text-warning">
                <span>Free plan limit reached.</span>
                <br />
                <a href="/pricing" className="link text-primary text-xs">
                  Upgrade for unlimited workflows
                </a>
              </div>
            )}
          </div>
        )}
        
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
                href={`/tools/memu/editor?id=${workflow.id}`}
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