import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";
import { Protect } from "@clerk/nextjs";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Protect feature={"all_freemium_features"} fallback={<div>Loading...</div>}>
      <ToolsLayoutClient>{children}</ToolsLayoutClient>
    </Protect>
  );
}
