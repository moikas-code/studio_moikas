import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToolsLayoutClient>{children}</ToolsLayoutClient>;
}
