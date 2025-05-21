"use client";
import React, { useReducer } from "react";
import Sidebar from "../components/sidebar";
import User_sync from "../components/user_sync";

// Sidebar reducer and actions
interface SidebarState {
  open: boolean;
}
type SidebarAction = { type: "toggle" } | { type: "close" } | { type: "open" };

function sidebar_reducer(state: SidebarState, action: SidebarAction): SidebarState {
  switch (action.type) {
    case "toggle":
      return { open: !state.open };
    case "close":
      return { open: false };
    case "open":
      return { open: true };
    default:
      return state;
  }
}

export default function ToolsLayoutClient({ plan, children }: { plan: string; children: React.ReactNode }) {
  const [sidebar_state, dispatch] = useReducer(sidebar_reducer, { open: false });
  return (
    <div className="flex min-h-screen">
      <User_sync plan={plan} />
      <Sidebar
        open={sidebar_state.open}
        on_close={() => dispatch({ type: "close" })}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
} 