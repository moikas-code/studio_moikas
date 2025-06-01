import React from 'react';
import { Undo, Redo, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { Canvas_state } from '@/lib/image_editor_utils';

interface Image_editor_header_props {
  canvas_state: Canvas_state;
  on_undo: () => void;
  on_redo: () => void;
  on_zoom_in: () => void;
  on_zoom_out: () => void;
  on_reset_zoom: () => void;
  on_export: () => void;
}

export const Image_editor_header: React.FC<Image_editor_header_props> = ({
  canvas_state,
  on_undo,
  on_redo,
  on_zoom_in,
  on_zoom_out,
  on_reset_zoom,
  on_export,
}) => {
  return (
    <div className="bg-base-200 border-b border-base-300 p-4">
      <div className="flex items-center justify-end max-w-7xl mx-auto">

        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-ghost"
            onClick={on_undo}
            disabled={canvas_state.history_index <= 0}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={on_redo}
            disabled={canvas_state.history_index >= canvas_state.history.length - 1}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={on_zoom_in}
            disabled={canvas_state.zoom >= 5}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={on_zoom_out}
            disabled={canvas_state.zoom <= 0.1}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={on_reset_zoom}
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={on_export}
            disabled={!canvas_state.image_base64}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>
    </div>
  );
}; 