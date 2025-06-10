"use client";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase_client";

interface MpContextType {
  mp_tokens: number | null;
  renewable_tokens: number | null;
  permanent_tokens: number | null;
  is_loading_tokens: boolean;
  token_error: string | null;
  refresh_mp: () => Promise<void>;
  plan: string | null;
}

export const MpContext = createContext<MpContextType>({
  mp_tokens: null,
  renewable_tokens: null,
  permanent_tokens: null,
  is_loading_tokens: false,
  token_error: null,
  refresh_mp: async () => {},
  plan: null,
});

export function MpProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseClient();
  const [mp_tokens, set_mp_tokens] = useState<number | null>(null);
  const [renewable_tokens, set_renewable_tokens] = useState<number | null>(null);
  const [permanent_tokens, set_permanent_tokens] = useState<number | null>(null);
  const [is_loading_tokens, set_is_loading_tokens] = useState(false);
  const [token_error, set_token_error] = useState<string | null>(null);
  const [plan, set_plan] = useState<string | null>(null);

  const fetch_tokens = useCallback(async () => {
    if (!isLoaded || !user || !supabase) return;
    set_is_loading_tokens(true);
    set_token_error(null);
    try {
      // Get user_id from users table using clerk_id
      const { data: user_row, error: user_error } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();
      if (user_error || !user_row?.id) {
        set_token_error("User not found");
        set_mp_tokens(null);
        set_renewable_tokens(null);
        set_permanent_tokens(null);
        set_plan(null);
        set_is_loading_tokens(false);
        return;
      }
      // Get tokens and plan from subscriptions table
      const { data: sub_row, error: sub_error } = await supabase
        .from("subscriptions")
        .select("renewable_tokens, permanent_tokens, plan")
        .eq("user_id", user_row.id)
        .single();
      if (sub_error || (!sub_row?.renewable_tokens && !sub_row?.permanent_tokens) || !sub_row?.plan) {
        set_token_error("No subscription");
        set_mp_tokens(null);
        set_renewable_tokens(null);
        set_permanent_tokens(null);
        set_plan(null);
      } else {
        const renewable = typeof sub_row.renewable_tokens === "number" ? sub_row.renewable_tokens : 0;
        const permanent = typeof sub_row.permanent_tokens === "number" ? sub_row.permanent_tokens : 0;
        set_renewable_tokens(renewable);
        set_permanent_tokens(permanent);
        set_mp_tokens(renewable + permanent);
        set_plan(sub_row.plan);
      }
    } catch {
      set_token_error("Error loading MP");
      set_mp_tokens(null);
      set_renewable_tokens(null);
      set_permanent_tokens(null);
      set_plan(null);
    } finally {
      set_is_loading_tokens(false);
    }
  }, [isLoaded, user, supabase]);

  useEffect(() => {
    fetch_tokens();
  }, [fetch_tokens]);

  return (
    <MpContext.Provider value={{ mp_tokens, renewable_tokens, permanent_tokens, is_loading_tokens, token_error, refresh_mp: fetch_tokens, plan }}>
      {children}
    </MpContext.Provider>
  );
} 