import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { 
  Undo, 
  Redo, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Save,
  FolderOpen,
  FileDown,
  FileUp,
  Plus,
  Clock,
  MoreVertical
} from 'lucide-react';
import { track } from '@vercel/analytics';
import { Canvas_state } from '@/lib/image_editor_utils';
import { Editor_session } from '@/lib/image_editor_storage';

interface Image_editor_header_props {
  canvas_state: Canvas_state;
  on_undo: () => void;
  on_redo: () => void;
  on_zoom_in: () => void;
  on_zoom_out: () => void;
  on_reset_zoom: () => void;
  on_export: () => void;
  // Session management
  session_name?: string;
  is_saving?: boolean;
  last_saved?: Date | null;
  sessions_list?: Editor_session[];
  on_save?: () => void;
  on_save_as?: (name: string) => void;
  on_load_session?: (session_id: string) => void;
  on_new_session?: () => void;
  on_export_session?: () => void;
  on_import_session?: (file: File) => void;
}

export const Image_editor_header: React.FC<Image_editor_header_props> = ({
  canvas_state,
  on_undo,
  on_redo,
  on_zoom_in,
  on_zoom_out,
  on_reset_zoom,
  on_export,
  session_name = 'Untitled Project',
  is_saving = false,
  last_saved,
  sessions_list = [],
  on_save,
  on_save_as,
  on_load_session,
  on_new_session,
  on_export_session,
  on_import_session,
}) => {
  const [show_save_as_modal, set_show_save_as_modal] = useState(false);
  const [new_session_name, set_new_session_name] = useState(session_name);
  const [show_sessions_dropdown, set_show_sessions_dropdown] = useState(false);
  const file_input_ref = useRef<HTMLInputElement>(null);

  const handle_save_as = () => {
    if (on_save_as && new_session_name.trim()) {
      track("Image Editor Session", { action: "save_as", new_name: new_session_name.trim(), previous_name: session_name });
      on_save_as(new_session_name.trim());
      set_show_save_as_modal(false);
    }
  };

  const handle_import = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && on_import_session) {
      track("Image Editor Session", { action: "import_session", file_name: file.name, file_size: file.size });
      on_import_session(file);
    }
  };

  const format_time_ago = (date: Date | null) => {
    if (!date) return 'Never';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-base-200 border-b border-base-300 p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Session info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{session_name}</h2>
            {is_saving && (
              <div className="loading loading-spinner loading-xs"></div>
            )}
            {!is_saving && last_saved && (
              <div className="flex items-center gap-1 text-xs text-base-content/60">
                <Clock className="w-3 h-3" />
                Saved {format_time_ago(last_saved)}
              </div>
            )}
          </div>
          
          {/* Session actions dropdown */}
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-sm btn-ghost">
              <MoreVertical className="w-4 h-4" />
            </label>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a onClick={() => {
                  track("Image Editor Session", { action: "save", session_name });
                  on_save?.();
                }}>
                  <Save className="w-4 h-4" />
                  Save
                  <kbd className="kbd kbd-xs">Ctrl+S</kbd>
                </a>
              </li>
              <li>
                <a onClick={() => {
                  track("Image Editor Session", { action: "save_as_open", session_name });
                  set_show_save_as_modal(true);
                }}>
                  <Save className="w-4 h-4" />
                  Save As...
                </a>
              </li>
              <li>
                <a onClick={() => set_show_sessions_dropdown(true)}>
                  <FolderOpen className="w-4 h-4" />
                  Open...
                </a>
              </li>
              <li>
                <a onClick={() => {
                  track("Image Editor Session", { action: "new_project", session_name });
                  on_new_session?.();
                }}>
                  <Plus className="w-4 h-4" />
                  New Project
                </a>
              </li>
              <div className="divider my-1"></div>
              <li>
                <a onClick={() => file_input_ref.current?.click()}>
                  <FileUp className="w-4 h-4" />
                  Import Session
                </a>
              </li>
              <li>
                <a onClick={() => {
                  track("Image Editor Session", { action: "export_session", session_name });
                  on_export_session?.();
                }}>
                  <FileDown className="w-4 h-4" />
                  Export Session
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Right side - Existing controls */}

        <div className="flex gap-2">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              track("Image Editor Action", { action: "undo", history_index: canvas_state.history_index });
              on_undo();
            }}
            disabled={canvas_state.history_index <= 0}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              track("Image Editor Action", { action: "redo", history_index: canvas_state.history_index });
              on_redo();
            }}
            disabled={canvas_state.history_index >= canvas_state.history.length - 1}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              track("Image Editor Action", { action: "zoom_in", zoom_level: canvas_state.zoom });
              on_zoom_in();
            }}
            disabled={canvas_state.zoom >= 5}
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              track("Image Editor Action", { action: "zoom_out", zoom_level: canvas_state.zoom });
              on_zoom_out();
            }}
            disabled={canvas_state.zoom <= 0.1}
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => {
              track("Image Editor Action", { action: "reset_zoom", zoom_level: canvas_state.zoom });
              on_reset_zoom();
            }}
            title="Reset Zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-primary"
            onClick={() => {
              track("Image Editor Action", { action: "export", has_image: !!canvas_state.image_base64, text_elements_count: canvas_state.text_elements.length });
              on_export();
            }}
            disabled={!canvas_state.image_base64}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Save As Modal */}
      {show_save_as_modal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Save Project As</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Project Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter project name"
                className="input input-bordered w-full"
                value={new_session_name}
                onChange={(e) => set_new_session_name(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handle_save_as()}
                autoFocus
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => set_show_save_as_modal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handle_save_as}>
                Save
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => set_show_save_as_modal(false)}></div>
        </div>
      )}

      {/* Sessions List Modal */}
      {show_sessions_dropdown && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Open Project</h3>
            {sessions_list.length === 0 ? (
              <p className="text-center py-8 text-base-content/60">No saved projects</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {sessions_list.map((session) => (
                  <div
                    key={session.id}
                    className="card bg-base-200 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      track("Image Editor Session", { action: "load_session", session_id: session.id, session_name: session.name });
                      on_load_session?.(session.id);
                      set_show_sessions_dropdown(false);
                    }}
                  >
                    <figure className="px-4 pt-4">
                      {session.thumbnail ? (
                        <div className="relative h-32 w-full">
                          <Image
                            src={session.thumbnail}
                            alt={`Preview of ${session.name}`}
                            fill
                            className="rounded-xl object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 w-full bg-base-300 rounded-xl flex items-center justify-center">
                          <span className="text-base-content/40">No preview</span>
                        </div>
                      )}
                    </figure>
                    <div className="card-body p-4">
                      <h4 className="card-title text-sm">{session.name}</h4>
                      <p className="text-xs text-base-content/60">
                        Updated {format_time_ago(new Date(session.updated_at))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-action">
              <button className="btn" onClick={() => set_show_sessions_dropdown(false)}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => set_show_sessions_dropdown(false)}></div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={file_input_ref}
        type="file"
        accept=".json"
        onChange={handle_import}
        className="hidden"
      />
    </div>
  );
}; 