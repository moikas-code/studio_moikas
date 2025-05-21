import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";
import { auth } from "@clerk/nextjs/server";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolsLayoutClient>{children}</ToolsLayoutClient>;
}
