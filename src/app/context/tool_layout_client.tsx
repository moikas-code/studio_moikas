"use client";
import React from "react";
import Sidebar from "../components/sidebar";

export default function ToolsLayoutClient({
  plan,
  children,
}: {
  plan: string;
  children: React.ReactNode;
}) {
  const [sidebar_open, set_sidebar_open] = React.useState(false);
  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebar_open} on_close={() => set_sidebar_open(false)} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
