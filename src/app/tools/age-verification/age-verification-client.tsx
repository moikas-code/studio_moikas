"use client";
import React from "react";
import AgeVerificationForm from "@/components/auth/age_verification_form";

export default function AgeVerificationClient() {
  const handle_complete = () => {
    // Redirect to originally requested page or tools
    const return_url = new URLSearchParams(window.location.search).get("return_url");
    // Validate the return_url to ensure it is safe
    const is_valid_url = (url) => {
      try {
        const parsed_url = new URL(url, window.location.origin);
        return parsed_url.origin === window.location.origin; // Ensure same-origin
      } catch {
        return false; // Invalid URL
      }
    };
    const safe_url = return_url && is_valid_url(return_url) ? return_url : "/tools";
    // Use window.location for a full page reload to ensure session refresh
    window.location.href = safe_url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl">
        <AgeVerificationForm onComplete={handle_complete} />
      </div>
    </div>
  );
}
