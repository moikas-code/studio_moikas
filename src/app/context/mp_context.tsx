"use client";
import React, { createContext, useCallback, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase_client";

interface MpContextType {
  mp_tokens: number | null;
  is_loading_tokens: boolean;
  token_error: string | null;
  refresh_mp: () => Promise<void>;
  plan: string | null;
}

export const MpContext = createContext<MpContextType>({
  mp_tokens: null,
  is_loading_tokens: false,
  token_error: null,
  refresh_mp: async () => {},
  plan: null,
});

export function MpProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseClient();
  const [mp_tokens, set_mp_tokens] = useState<number | null>(null);
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
        set_plan(null);
        set_is_loading_tokens(false);
        return;
      }
      // Get tokens and plan from subscriptions table
      const { data: sub_row, error: sub_error } = await supabase
        .from("subscriptions")
        .select("tokens, plan")
        .eq("user_id", user_row.id)
        .single();
      if (sub_error || typeof sub_row?.tokens !== "number" || !sub_row?.plan) {
        set_token_error("No subscription");
        set_mp_tokens(null);
        set_plan(null);
      } else {
        set_mp_tokens(sub_row.tokens);
        set_plan(sub_row.plan);
      }
    } catch {
      set_token_error("Error loading MP");
      set_mp_tokens(null);
      set_plan(null);
    } finally {
      set_is_loading_tokens(false);
    }
  }, [isLoaded, user, supabase]);

  useEffect(() => {
    fetch_tokens();
  }, [fetch_tokens]);

  return (
    <MpContext.Provider value={{ mp_tokens, is_loading_tokens, token_error, refresh_mp: fetch_tokens, plan }}>
      {children}
    </MpContext.Provider>
  );
} 