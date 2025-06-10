"use client";
import React from "react";

export default function Analytics_opt_out_toggle() {
  const [analytics_disabled, set_analytics_disabled] = React.useState(false);

  React.useEffect(() => {
    set_analytics_disabled(!!localStorage.getItem("va-disable"));
  }, []);

  const handle_toggle_analytics = () => {
    if (analytics_disabled) {
      localStorage.removeItem("va-disable");
      set_analytics_disabled(false);
    } else {
      localStorage.setItem("va-disable", "1");
      set_analytics_disabled(true);
    }
  };

  return (
    <label>
      <input
        type="checkbox"
        checked={analytics_disabled}
        onChange={handle_toggle_analytics}
        style={{ marginRight: 8 }}
        aria-checked={analytics_disabled}
        aria-label="Opt out of analytics tracking"
      />
      Opt out of analytics tracking
    </label>
  );
} 