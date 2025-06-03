import React from "react";

interface workflow_template {
  id: string;
  name: string;
  description?: string;
  graph_data: Record<string, unknown>;
}

interface templates_modal_props {
  show_templates: boolean;
  templates: Record<string, workflow_template[]>;
  create_from_template: (template_id: string, template_name: string) => Promise<void>;
  set_show_templates: (show: boolean) => void;
}

export default function templates_modal({
  show_templates,
  templates,
  create_from_template,
  set_show_templates
}: templates_modal_props) {
  if (!show_templates) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-4xl">
        <h3 className="font-bold text-lg mb-4">Workflow Templates</h3>
        
        <div className="space-y-6">
          {Object.entries(templates).map(([category, category_templates]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold uppercase text-base-content/60 mb-2">
                {category.replace("_", " ")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {category_templates.map((template) => (
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
  );
}