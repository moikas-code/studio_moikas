"use client";
import React from "react";
import AgeVerificationForm from "@/components/auth/age_verification_form";

export default function AgeVerificationPage() {
  const handle_complete = () => {
    // Redirect to originally requested page or tools
    const return_url = new URLSearchParams(window.location.search).get("return_url");
    // Use window.location for a full page reload to ensure session refresh
    window.location.href = return_url || "/tools";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-100 to-base-200 flex items-center justify-center p-4">
      <div className="bg-base-100 rounded-2xl shadow-xl">
        <AgeVerificationForm onComplete={handle_complete} />
      </div>
    </div>
  );
}
