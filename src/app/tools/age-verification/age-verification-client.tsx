"use client";
import React from "react";
import AgeVerificationForm from "@/components/auth/age_verification_form";

export default function AgeVerificationClient() {
  const handle_complete = () => {
    // Redirect to originally requested page or tools
    const return_url = new URLSearchParams(window.location.search).get("return_url");

    // Validate and sanitize the return_url to ensure it is safe
    const get_safe_url = (url: string | null): string => {
      if (!url) return "/tools";

      try {
        // Parse the URL relative to current origin
        const parsed_url = new URL(url, window.location.origin);

        // Only allow same-origin URLs to prevent XSS
        if (parsed_url.origin !== window.location.origin) {
          return "/tools";
        }

        // Return only the pathname and search params, ensuring it's relative
        return parsed_url.pathname + parsed_url.search + parsed_url.hash;
      } catch {
        // If URL parsing fails, return default
        return "/tools";
      }
    };

    const safe_url = get_safe_url(return_url);
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
