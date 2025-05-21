import React from "react";
import { auth } from "@clerk/nextjs/server";
import ToolsLayoutClient from "../context/tool_layout_client";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { has } = await auth();
  const plan = has({ plan: "standard" }) ? "standard" : "free";
  return <ToolsLayoutClient plan={plan}>{children}</ToolsLayoutClient>;
}
