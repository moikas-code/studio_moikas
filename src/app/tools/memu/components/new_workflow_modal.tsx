import React from "react";
import Workflow_status_badge from "./workflow_status_badge";

interface new_workflow_modal_props {
  show_new_workflow_modal: boolean;
  new_workflow_name: string;
  new_workflow_description: string;
  new_workflow_status: 'stable' | 'early_access' | 'experimental' | 'deprecated';
  creating_workflow: boolean;
  set_new_workflow_name: (name: string) => void;
  set_new_workflow_description: (desc: string) => void;
  set_new_workflow_status: (status: 'stable' | 'early_access' | 'experimental' | 'deprecated') => void;
  set_show_new_workflow_modal: (show: boolean) => void;
  create_new_workflow: () => Promise<void>;
}

export default function new_workflow_modal({
  show_new_workflow_modal,
  new_workflow_name,
  new_workflow_description,
  new_workflow_status,
  creating_workflow,
  set_new_workflow_name,
  set_new_workflow_description,
  set_new_workflow_status,
  set_show_new_workflow_modal,
  create_new_workflow
}: new_workflow_modal_props) {
  if (!show_new_workflow_modal) return null;

  const handle_close = () => {
    set_show_new_workflow_modal(false);
    set_new_workflow_name("");
    set_new_workflow_description("");
    set_new_workflow_status('stable');
  };

  return (
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
          
          <div className="form-control">
            <label className="label">
              <span className="label-text">Status</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={new_workflow_status}
              onChange={(e) => set_new_workflow_status(e.target.value as 'stable' | 'early_access' | 'experimental' | 'deprecated')}
            >
              <option value="stable">Stable - Ready for production use</option>
              <option value="early_access">Early Access - May have bugs or incomplete features</option>
              <option value="experimental">Experimental - Beta version, may be unstable</option>
              <option value="deprecated">Deprecated - Will be removed in future versions</option>
            </select>
            <div className="mt-2">
              <Workflow_status_badge status={new_workflow_status} size="md" />
            </div>
          </div>
        </div>
        
        <div className="modal-action">
          <button 
            onClick={handle_close} 
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
      <div className="modal-backdrop" onClick={handle_close} />
    </div>
  );
}