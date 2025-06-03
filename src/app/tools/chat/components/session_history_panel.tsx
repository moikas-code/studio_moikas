import React, { useState } from "react";
import { History, Trash2, MessageSquare, Calendar, X } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { chat_session } from "../types";

interface session_history_panel_props {
  sessions: chat_session[];
  show_sessions_panel: boolean;
  loading_sessions: boolean;
  deleting_session: string | null;
  current_session_id: string;
  set_show_sessions_panel: (show: boolean) => void;
  load_session: (session_id: string) => Promise<void>;
  delete_session: (session_id: string) => Promise<void>;
}

export default function session_history_panel({
  sessions,
  show_sessions_panel,
  loading_sessions,
  deleting_session,
  current_session_id,
  set_show_sessions_panel,
  load_session,
  delete_session
}: session_history_panel_props) {
  const [confirm_delete, set_confirm_delete] = useState<string | null>(null);
  const { user } = useUser();

  const handle_delete_click = (session_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    set_confirm_delete(session_id);
  };

  const handle_confirm_delete = async (session_id: string) => {
    await delete_session(session_id);
    set_confirm_delete(null);
  };

  const format_date = (date_string: string) => {
    const date = new Date(date_string);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  if (!show_sessions_panel) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={() => set_show_sessions_panel(false)}
      />
      
      {/* Sliding Panel */}
      <div className={`fixed top-0 right-0 h-full w-80 bg-base-200 border-l border-base-300 shadow-xl z-50 transform transition-transform duration-300 ${
        show_sessions_panel ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="p-4 h-full overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5" />
            <h3 className="text-lg font-semibold">Chat History</h3>
          </div>
          <button
            onClick={() => set_show_sessions_panel(false)}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close history panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading_sessions && (
          <div className="flex justify-center p-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        )}

        {!loading_sessions && sessions.length === 0 && (
          <div className="text-center py-8 text-base-content/60">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No chat sessions yet</p>
            <p className="text-sm mt-2">Start a conversation to see your history</p>
          </div>
        )}

          <div className="space-y-2 flex-1">
            {sessions.map(session => (
              <div
                key={session.id}
                className={`group relative p-3 rounded-lg border transition-colors cursor-pointer ${
                  session.id === current_session_id
                    ? "bg-primary/10 border-primary"
                    : "bg-base-100 border-base-300 hover:bg-base-300/50"
                }`}
                onClick={() => load_session(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      {session.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-base-content/60 mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format_date(session.last_message_date)}</span>
                      <span>•</span>
                      <span>{session.message_count} messages</span>
                    </div>
                    {session.last_message_preview && (
                      <p className="text-xs text-base-content/70 mt-2 line-clamp-2">
                        {session.last_message_preview}...
                      </p>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => handle_delete_click(session.id, e)}
                    className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={deleting_session === session.id}
                    aria-label="Delete session"
                  >
                    {deleting_session === session.id ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {session.id === current_session_id && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirm_delete && (
        <div className="modal modal-open" style={{ zIndex: 60 }}>
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Delete Chat Session</h3>
            <p className="mb-6">
              Are you sure you want to delete this chat session? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button 
                onClick={() => set_confirm_delete(null)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button 
                onClick={() => handle_confirm_delete(confirm_delete)}
                className="btn btn-error"
                disabled={deleting_session === confirm_delete}
              >
                {deleting_session === confirm_delete ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => set_confirm_delete(null)} />
        </div>
      )}
    </>
  );
}