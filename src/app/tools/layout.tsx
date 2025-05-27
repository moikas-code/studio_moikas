import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";
import { Protect } from "@clerk/nextjs";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Custom loading layout for Studio Moikas
  const loading_layout = (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-base-900 text-base-100">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-jade"></div>
        <div className="text-2xl font-bold tracking-wide">Studio Moikas</div>
        <div className="text-base-400 text-sm">Loading your creative tools...</div>
      </div>
    </div>
  );
  return (
    <Protect feature={"all_freemium_features"} fallback={loading_layout}>
      <ToolsLayoutClient>{children}</ToolsLayoutClient>
    </Protect>
  );
}
