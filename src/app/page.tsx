"use client";
import React from "react";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { user } = useUser();
  const username = user?.username || user?.firstName || "Anon";

  return (
    <div>
      <div className="flex flex-col items-center justify-center min-h-full pt-10">
        <SignedIn>
          <h1 className="text-3xl font-bold">Welcome back, {username.charAt(0).toUpperCase() + username.slice(1)}</h1>
          <Link href="/pricing" className="btn btn-secondary mt-6">View Pricing</Link>
        </SignedIn>
        <SignedOut>
          <h1 className="text-3xl font-bold">Welcome to Studio.Moikas</h1>
          <Link href="/pricing" className="btn btn-secondary mt-6">View Pricing</Link>
        </SignedOut>
      </div>
    </div>
  );
}
