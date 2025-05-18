"use client";
import React, { useContext } from "react";
import { useUser } from "@clerk/nextjs";
import { MpContext } from "../components/../context/mp_context";

export default function Tools_home_page() {
  const { user, isLoaded } = useUser();
  const { mp_tokens, is_loading_tokens, token_error, plan } = useContext(MpContext);
  const username = user?.username || user?.firstName || user?.lastName || user?.emailAddresses?.[0]?.emailAddress || "User";

  return (
    <div className="w-full max-w-3xl mx-auto py-12 px-4 flex flex-col items-center">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-center">Welcome, {isLoaded ? username : "..."}!</h1>
      <p className="text-lg text-gray-700 dark:text-gray-200 mb-8 text-center">
        This is your creative tools dashboard. Here you can access all Studio Moikas tools.
      </p>
      <div className="w-full max-w-md bg-white dark:bg-base-200 rounded-xl shadow-lg border border-base-200 p-6 flex flex-col items-center mb-8">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <div className="flex flex-col items-center gap-2">
          <span className="text-gray-600 dark:text-gray-300">Plan: <span className="font-mono font-bold text-primary">{plan || "-"}</span></span>
          <span className="text-gray-600 dark:text-gray-300">Mana Points (Credits): {is_loading_tokens ? <span className="loading loading-spinner loading-xs" aria-label="Loading MP" role="status"></span> : token_error ? <span className="text-error">--</span> : <span className="font-mono font-bold text-orange-500">{mp_tokens}</span>}</span>
        </div>
      </div>
      <div className="w-full max-w-2xl flex flex-col gap-4">
        <div className="alert alert-info bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200">
          <span>Use the sidebar to access available tools like the Image Generator.</span>
        </div>
      </div>
    </div>
  );
} 