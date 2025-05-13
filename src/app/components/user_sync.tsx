"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase_client";

/**
 * User_sync component ensures the signed-in Clerk user is present in Supabase,
 * and initializes a subscription if missing. Runs on login and user change.
 */
export default function User_sync() {
  const { user, isLoaded } = useUser();
  const supabase = useSupabaseClient();

  // Placeholder: implement actual logic to determine if user is hobby
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  const is_hobby_user = (user: any): boolean => {
    // TODO: Replace with real check, e.g.:
    // return user.publicMetadata?.plan === 'hobby';
    return false;
  };

  useEffect(() => {
    if (!isLoaded || !user || !supabase) return;

    const sync_user = async () => {
      const clerk_user_id = user.id;
      const email = user.emailAddresses?.[0]?.emailAddress || null;
      if (!clerk_user_id || !email) return;

      // Check if user exists in Supabase
      const { data: existing_user, error: user_error } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", clerk_user_id)
        .single();

      if (user_error && user_error.code !== "PGRST116") {
        // Ignore 'No rows found' error, handle others
        console.error("Supabase user fetch error:", user_error.message);
        return;
      }

      let user_id = existing_user?.id;
      // If user does not exist, upsert
      if (!user_id) {
        const plan = is_hobby_user(user) ? "hobby" : "free";
        const tokens = plan === "hobby" ? 500 : 100;
        const { data: upserted_user, error: upsert_error } = await supabase
          .from("users")
          .upsert({ clerk_id: clerk_user_id, email }, { onConflict: "clerk_id" })
          .select()
          .single();
        if (upsert_error) {
          console.error("Supabase user upsert error:", upsert_error.message);
          return;
        }
        user_id = upserted_user.id;
        // Insert subscription for new user
        const { error: insert_error } = await supabase
          .from("subscriptions")
          .insert({
            user_id,
            plan,
            tokens,
            renewed_at: new Date().toISOString(),
          });
        if (insert_error) {
          console.error("Supabase subscription insert error:", insert_error.message);
        }
      } else {
        // Check if subscription exists
        const { data: subscription, error: sub_error } = await supabase
          .from("subscriptions")
          .select("id, plan")
          .eq("user_id", user_id)
          .single();

        if (sub_error && sub_error.code !== "PGRST116") {
          // Ignore 'No rows found' error, handle others
          console.error("Supabase subscription fetch error:", sub_error.message);
          return;
        }

        // If subscription does not exist, create it
        if (!subscription) {
          const plan = is_hobby_user(user) ? "hobby" : "free";
          const tokens = plan === "hobby" ? 500 : 100;
          const { error: insert_error } = await supabase
            .from("subscriptions")
            .insert({
              user_id,
              plan,
              tokens,
              renewed_at: new Date().toISOString(),
            });
          if (insert_error) {
            console.error("Supabase subscription insert error:", insert_error.message);
          }
        } else if (subscription.plan !== (is_hobby_user(user) ? "hobby" : "free")) {
          // If plan changed, update subscription
          const plan = is_hobby_user(user) ? "hobby" : "free";
          const tokens = plan === "hobby" ? 500 : 100;
          const { error: update_error } = await supabase
            .from("subscriptions")
            .update({ plan, tokens })
            .eq("user_id", user_id);
          if (update_error) {
            console.error("Supabase subscription update error:", update_error.message);
          }
        }
      }
    };

    sync_user();
    // Only run when user or supabase client changes
  }, [user, isLoaded, supabase]);

  return null;
} 