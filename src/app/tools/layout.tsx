import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";
import { auth } from "@clerk/nextjs/server";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { has } = await auth();
  const plan = has({ plan: "standard" }) ? "standard" : "free";
  return <ToolsLayoutClient plan={plan}>{children}</ToolsLayoutClient>;
}
