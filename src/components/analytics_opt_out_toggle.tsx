"use client";
import React from "react";
import { AlertCircle } from "lucide-react";

export default function Analytics_opt_out_toggle() {
  const [analytics_disabled, set_analytics_disabled] = React.useState(false);
  const [dnt_detected, set_dnt_detected] = React.useState(false);

  React.useEffect(() => {
    // Check Do Not Track browser setting
    const dnt = navigator.doNotTrack || (window as typeof window & { doNotTrack?: string }).doNotTrack || (navigator as typeof navigator & { msDoNotTrack?: string }).msDoNotTrack;
    const has_dnt = dnt === "1" || dnt === "yes";
    
    set_dnt_detected(has_dnt);
    set_analytics_disabled(!!localStorage.getItem("va-disable"));
  }, []);

  const handle_toggle_analytics = () => {
    if (analytics_disabled) {
      localStorage.removeItem("va-disable");
      localStorage.removeItem("dnt-detected");
      set_analytics_disabled(false);
    } else {
      localStorage.setItem("va-disable", "1");
      set_analytics_disabled(true);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={analytics_disabled}
          onChange={handle_toggle_analytics}
          className="checkbox checkbox-sm"
          aria-checked={analytics_disabled}
          aria-label="Opt out of analytics tracking"
        />
        <span className="ml-2 text-sm">
          Opt out of analytics tracking
        </span>
      </label>
      {dnt_detected && (
        <div className="flex items-center gap-1 text-xs text-base-content/60">
          <AlertCircle className="w-3 h-3" />
          <span>Do Not Track detected</span>
        </div>
      )}
    </div>
  );
} 