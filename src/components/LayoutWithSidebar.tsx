"use client";
import React, { useReducer } from "react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { usePathname } from "next/navigation";
import Footer from "./footer";
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

export default function LayoutWithSidebar({ children}: { children: React.ReactNode }) {
  const [sidebar_state, dispatch] = useReducer(sidebar_reducer, { open: false });
  const pathname = usePathname();
  const show_sidebar = pathname.startsWith("/tools");
  const hide_navbar = pathname.startsWith("/tools");
  const hide_footer = pathname.startsWith("/tools");
  return (
    <>
      {!hide_navbar && <Navbar />}
      <div className="flex min-h-screen w-full">
        {show_sidebar && <Sidebar open={sidebar_state.open} on_close={() => dispatch({ type: "close" })} />}
        <main className="flex-1 min-h-screen">{children}</main>
      </div>
      {!hide_footer && <Footer />}
    </>
  );
} 