"use client";
import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

export default function Analytics_wrapper() {
  const [enabled, set_enabled] = useState(false);

  useEffect(() => {
    set_enabled(!localStorage.getItem("va-disable"));
  }, []);

  if (!enabled) return null;
  return <Analytics />;
} 