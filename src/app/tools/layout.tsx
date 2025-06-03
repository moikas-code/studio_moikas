import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Tools_layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  return <ToolsLayoutClient>{children}</ToolsLayoutClient>;
}
