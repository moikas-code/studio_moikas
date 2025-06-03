import React from "react";

interface error_display_props {
  error: string | null;
}

export default function error_display({ error }: error_display_props) {
  if (!error) return null;

  return (
    <div className="px-4">
      <div className="alert alert-error max-w-4xl mx-auto">
        <span>{error}</span>
      </div>
    </div>
  );
}