"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { useSession } from "@clerk/nextjs";
import { useEffect, useState } from "react";

// Server-side client (for API routes)
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Client-side hook for authenticated Supabase client
export function useSupabaseClient() {
  const { session } = useSession();
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    async function initializeClient() {
      if (!session) return;
      const token = await session.getToken({ template: "supabase" });
      if (!token) {
        console.error("No Supabase token found");
        return;
      }
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token}` },
          },
        }
      );
      setSupabase(client);
    }
    initializeClient();
  }, [session]);
  return supabase;
}
