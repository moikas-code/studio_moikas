import React from "react";

interface Error_display_props {
  error_message: string | null;
}

export default function Error_display({ error_message }: Error_display_props) {
  if (!error_message) return null;
  return (
    <div className="w-full max-w-5xl mx-auto mt-4 alert alert-error border border-error bg-error/10 text-error font-bold shadow-lg">
      {error_message}
    </div>
  );
} 