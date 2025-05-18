import React from "react";
import Sidebar from "../components/sidebar";
import User_sync from "../components/user_sync";

export default function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <User_sync />
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
} 