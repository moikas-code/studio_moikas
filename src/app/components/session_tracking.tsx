"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@vercel/analytics";

export default function Session_tracking() {
  const pathname = usePathname();

  useEffect(() => {
    if (!localStorage.getItem("session_start")) {
      localStorage.setItem("session_start", Date.now().toString());
    }
    let visited = [];
    try {
      visited = JSON.parse(localStorage.getItem("visited_pages") || "[]");
    } catch {
      visited = [];
    }
    if (visited[visited.length - 1] !== pathname) {
      visited.push(pathname);
      localStorage.setItem("visited_pages", JSON.stringify(visited));
    }
  }, [pathname]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const start = parseInt(localStorage.getItem("session_start") || "0", 10);
      const duration = start ? Math.floor((Date.now() - start) / 1000) : 0;
      let visited = [];
      try {
        visited = JSON.parse(localStorage.getItem("visited_pages") || "[]");
      } catch {
        visited = [];
      }
      track("Session Ended", {
        duration_seconds: duration,
        visited_pages: visited.join(","),
        entry_page: visited[0] || "",
        exit_page: visited[visited.length - 1] || "",
        pages_visited_count: visited.length,
        timestamp: new Date().toISOString(),
      });
      localStorage.removeItem("session_start");
      localStorage.removeItem("visited_pages");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return null;
} 