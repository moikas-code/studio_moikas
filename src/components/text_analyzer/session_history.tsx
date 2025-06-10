"use client";
import React, { useState } from 'react';
import type { ChatSession } from '@/types/session';

interface SessionHistoryProps {
  sessions: ChatSession[];
  current_session_id: string | null;
  loading: boolean;
  on_session_select: (session_id: string) => void;
  on_session_delete: (session_id: string) => void;
  on_new_session: () => void;
}

export default function SessionHistory({
  sessions,
  current_session_id,
  loading,
  on_session_select,
  on_session_delete,
  on_new_session
}: SessionHistoryProps) {
  const [delete_confirmation, set_delete_confirmation] = useState<string | null>(null);

  const handle_delete_click = (session_id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    set_delete_confirmation(session_id);
  };

  const confirm_delete = async (session_id: string) => {
    await on_session_delete(session_id);
    set_delete_confirmation(null);
  };

  const cancel_delete = () => {
    set_delete_confirmation(null);
  };

  const format_date = (date_string: string) => {
    const date = new Date(date_string);
    const now = new Date();
    const diff_hours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diff_hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diff_hours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="w-80 bg-base-100 border-r border-base-300 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Chat History</h2>
          <button
            onClick={on_new_session}
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            + New
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="flex-1 overflow-y-auto">
        {loading && sessions.length === 0 ? (
          <div className="p-4 text-center">
            <span className="loading loading-spinner loading-sm"></span>
            <p className="text-sm text-base-content/60 mt-2">Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-4 text-center text-base-content/60">
            <p className="text-sm">No chat sessions yet</p>
            <p className="text-xs mt-1">Create a new session to get started</p>
          </div>
        ) : (
          <div className="p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`
                  p-3 mb-2 rounded-lg cursor-pointer transition-colors
                  ${current_session_id === session.id 
                    ? 'bg-primary/10 border border-primary/20' 
                    : 'bg-base-200 hover:bg-base-300'
                  }
                `}
                onClick={() => on_session_select(session.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">
                      {session.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-base-content/60">
                        {session.message_count} messages
                      </span>
                      <span className="text-xs text-base-content/50">
                        {format_date(session.updated_at)}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handle_delete_click(session.id, e)}
                    className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 hover:bg-error/10"
                    aria-label="Delete session"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {delete_confirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="font-semibold mb-2">Delete Session</h3>
            <p className="text-sm text-base-content/70 mb-4">
              Are you sure you want to delete this session? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancel_delete}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => confirm_delete(delete_confirmation)}
                className="btn btn-error btn-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}