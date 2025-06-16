import React from "react";
import ToolsLayoutClient from "./ToolsLayoutClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { check_age_verification } from "@/lib/utils/auth/age_verification";

export default async function Tools_layout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Check age verification (backup check in case middleware is bypassed)
  const { is_verified, needs_verification } = await check_age_verification();

  if (needs_verification && !is_verified) {
    // For the tools layout, we'll just redirect to the age verification page
    // The middleware will handle preserving the return URL
    redirect("/tools/age-verification");
  }

  return <ToolsLayoutClient>{children}</ToolsLayoutClient>;
}
