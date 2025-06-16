"use client";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

export default function Analytics_wrapper() {
  const [enabled, set_enabled] = useState(false);

  useEffect(() => {
    // Check Do Not Track browser setting
    const dnt = navigator.doNotTrack || (window as typeof window & { doNotTrack?: string }).doNotTrack || (navigator as typeof navigator & { msDoNotTrack?: string }).msDoNotTrack;
    const has_dnt = dnt === "1" || dnt === "yes";
    
    // Check local storage opt-out
    const local_opt_out = localStorage.getItem("va-disable");
    
    // Analytics enabled only if:
    // 1. User hasn't opted out locally
    // 2. Browser doesn't have Do Not Track enabled
    set_enabled(!local_opt_out && !has_dnt);
    
    // If DNT is enabled, ensure local storage reflects this
    if (has_dnt && !local_opt_out) {
      localStorage.setItem("va-disable", "1");
      localStorage.setItem("dnt-detected", "1");
    }
  }, []);

  if (!enabled) return null;
  return <Analytics />;
} 