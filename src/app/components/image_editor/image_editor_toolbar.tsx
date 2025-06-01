import React from 'react';
import { 
  Upload, 
  Type, 
  Layers, 
  Move, 
  MousePointer, 
  Grid, 
  Trash2, 
  RotateCcw 
} from 'lucide-react';

interface Image_editor_toolbar_props {
  active_tool: 'select' | 'text' | 'move' | 'pan';
  show_templates: boolean;
  show_grid: boolean;
  selected_text_id: string | null;
  has_image: boolean;
  file_input_ref: React.RefObject<HTMLInputElement>;
  on_tool_change: (tool: 'select' | 'text' | 'move' | 'pan') => void;
  on_toggle_templates: () => void;
  on_toggle_grid: () => void;
  on_toggle_text_panel: () => void;
  on_delete_selected: () => void;
  on_clear_canvas: () => void;
  on_file_upload: () => void;
}

export const Image_editor_toolbar: React.FC<Image_editor_toolbar_props> = ({
  active_tool,
  show_templates,
  show_grid,
  selected_text_id,
  has_image,
  file_input_ref,
  on_tool_change,
  on_toggle_templates,
  on_toggle_grid,
  on_toggle_text_panel,
  on_delete_selected,
  on_clear_canvas,
  on_file_upload,
}) => {
  return (
    <div className="w-16 bg-base-200 border-r border-base-300 flex flex-col items-center py-4 gap-2">
      <button
        className="btn btn-sm btn-square btn-ghost tooltip tooltip-right"
        data-tip="Upload Image"
        onClick={on_file_upload}
      >
        <Upload className="w-4 h-4" />
      </button>
      
      <button
        className={`btn btn-sm btn-square ${show_templates ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
        data-tip="Templates"
        onClick={on_toggle_templates}
      >
        <Layers className="w-4 h-4" />
      </button>
      
      <button
        className={`btn btn-sm btn-square ${active_tool === 'pan' ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
        data-tip="Pan Tool"
        onClick={() => on_tool_change('pan')}
      >
        <Move className="w-4 h-4" />
      </button>
      
      <button
        className={`btn btn-sm btn-square ${active_tool === 'text' ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
        data-tip="Add Text"
        onClick={() => {
          on_tool_change('text');
          on_toggle_text_panel();
        }}
      >
        <Type className="w-4 h-4" />
      </button>
      
      <button
        className={`btn btn-sm btn-square ${active_tool === 'move' ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
        data-tip="Move Text"
        onClick={() => on_tool_change('move')}
      >
        <MousePointer className="w-4 h-4" />
      </button>
      
      <button
        className={`btn btn-sm btn-square ${show_grid ? 'btn-primary' : 'btn-ghost'} tooltip tooltip-right`}
        data-tip="Toggle Grid"
        onClick={on_toggle_grid}
      >
        <Grid className="w-4 h-4" />
      </button>
      
      {selected_text_id && (
        <button
          className="btn btn-sm btn-square btn-error tooltip tooltip-right"
          data-tip="Delete Selected"
          onClick={on_delete_selected}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
      
      {has_image && (
        <button
          className="btn btn-sm btn-square btn-warning tooltip tooltip-right"
          data-tip="Clear Canvas"
          onClick={on_clear_canvas}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}; 