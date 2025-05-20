import React from "react";
import Sidebar from "../components/sidebar";
import User_sync from "../components/user_sync";
import { auth } from "@clerk/nextjs/server";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { has } = await auth();
  const plan = has({ plan: "standard" }) ? "standard" : "free";
  console.log(plan, "plan");
  return (
    <div className="flex min-h-screen">
      <User_sync plan={plan} />
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
