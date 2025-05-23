"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

import { useSupabaseClient } from "@/lib/supabase_client";

/**
 * User_sync component ensures the signed-in Clerk user is present in Supabase,
 * and initializes a subscription if missing. Runs on login and user change.
 * Does NOT handle monthly token resets; those are handled by scheduled DB jobs.
 */
interface User_sync_props {
  plan: string;
}

export default function User_sync({ plan }: User_sync_props) {
  const { user, isLoaded } = useUser();

  const supabase = useSupabaseClient();

  const [stripeCleanupError, setStripeCleanupError] = useState<string | null>(null);

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
        const renewable_tokens = plan === "standard" ? 4000 : plan === "free" ? 125 : 0;
        const permanent_tokens = plan === "free" ? 0 : 100;
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
            renewable_tokens,
            permanent_tokens,
            renewed_at: new Date().toISOString(),
          });
        if (insert_error) {
          console.error("Supabase subscription insert error:", insert_error.message);
        }
      } else {
        // Check if subscription exists
        const { data: subscription, error: sub_error } = await supabase
          .from("subscriptions")
          .select("id, plan, renewable_tokens, permanent_tokens")
          .eq("user_id", user_id)
          .single();

        if (sub_error && sub_error.code !== "PGRST116") {
          // Ignore 'No rows found' error, handle others
          console.error("Supabase subscription fetch error:", sub_error.message);
          return;
        }

        // If subscription does not exist, create it
        if (!subscription) {
          const renewable_tokens = plan === "standard" ? 4000 : plan === "free" ? 125 : 0;
          const permanent_tokens = plan === "free" ? 0 : 100;
          const { error: insert_error } = await supabase
            .from("subscriptions")
            .insert({
              user_id,
              plan,
              renewable_tokens,
              permanent_tokens,
              renewed_at: new Date().toISOString(),
            });
          if (insert_error) {
            console.error("Supabase subscription insert error:", insert_error.message);
          }
        } else if (subscription.plan !== plan) {
          // If plan changed, update subscription
          const update_fields: { plan: string; renewable_tokens?: number; permanent_tokens?: number; renewed_at?: string } = { plan };
          if (plan === "standard") {
            update_fields.renewable_tokens = 4000;
            update_fields.renewed_at = new Date().toISOString();
          } else if (plan === "free") {
            update_fields.renewable_tokens = 125;
            update_fields.renewed_at = new Date().toISOString();
          }
          const { error: update_error } = await supabase
            .from("subscriptions")
            .update(update_fields)
            .eq("user_id", user_id);
          if (update_error) {
            console.error("Supabase subscription update error:", update_error.message);
          }
        }
      }
    };

    sync_user();

    // Stripe customer cleanup logic
    if (isLoaded && user && user.id && user.emailAddresses?.[0]?.emailAddress) {
      fetch("/api/stripe/cleanup-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          email: user.emailAddresses[0].emailAddress,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setStripeCleanupError("Account issue: " + data.error);
            console.error("Stripe cleanup error:", data.error);
          } else {
            setStripeCleanupError(null);
            console.log("Stripe cleanup result:", data);
          }
        })
        .catch((err) => {
          setStripeCleanupError("Network error during account check.");
          console.error("Stripe cleanup fetch error:", err);
        });
    }
    // Only run when user or supabase client changes
  }, [user, isLoaded, supabase, plan]);

  return (
    <>
      {stripeCleanupError && (
        <div className="alert alert-error my-2">
          {stripeCleanupError}
        </div>
      )}
    </>
  );
}
