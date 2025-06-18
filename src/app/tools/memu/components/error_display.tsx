import React from "react";

interface error_display_props {
  error: string | null;
  on_dismiss?: () => void;
}

export default function error_display({ error, on_dismiss }: error_display_props) {
  if (!error) return null;

  return (
    <div className="px-4">
      <div className="alert alert-error max-w-4xl mx-auto">
        <span>{error}</span>
        {on_dismiss && (
          <button className="btn btn-sm btn-ghost" onClick={on_dismiss}>
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
