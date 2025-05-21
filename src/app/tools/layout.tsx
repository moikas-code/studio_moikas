import React from "react";
import Sidebar from "../components/sidebar";
import User_sync from "../components/user_sync";
import Navbar from "../components/navbar";
import { auth } from "@clerk/nextjs/server";

function ToolsLayoutClient({ plan, children }: { plan: string; children: React.ReactNode }) {
  const [sidebar_open, set_sidebar_open] = React.useState(false);
  const handle_sidebar_toggle = () => set_sidebar_open((open) => !open);
  return (
    <div className="flex min-h-screen">
      <User_sync plan={plan} />
      <Navbar on_sidebar_toggle={handle_sidebar_toggle} sidebar_open={sidebar_open} />
      <Sidebar open={sidebar_open} on_close={() => set_sidebar_open(false)} />
      <main className="flex-1">{children}</main>
    </div>
  );
}

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { has } = await auth();
  const plan = has({ plan: "standard" }) ? "standard" : "free";
  return <ToolsLayoutClient plan={plan}>{children}</ToolsLayoutClient>;
}
