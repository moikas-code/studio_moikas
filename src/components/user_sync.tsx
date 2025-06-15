"use client";

import { useEffect, useState, useContext } from "react";
import { useUser } from "@clerk/nextjs";
import { MpContext } from "@/context/mp_context";

/**
 * User_sync component ensures the signed-in Clerk user is present in Supabase,
 * and initializes a subscription if missing. Runs on login and user change.
 * Does NOT handle monthly token resets; those are handled by scheduled DB jobs.
 */

export default function User_sync() {
  const { user, isLoaded } = useUser();
  const { refresh_mp } = useContext(MpContext);
  const [stripeCleanupError, setStripeCleanupError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !user) return;

    const sync_user = async () => {
      try {
        // Call the sync-user API endpoint
        const response = await fetch("/api/auth/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        });
        
        if (!response.ok) {
          const data = await response.json();
          console.error("User sync error:", data.error);
        } else {
          // Refresh MP tokens after successful sync
          await refresh_mp();
        }
      } catch (error) {
        console.error("Failed to sync user:", error);
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
          }
        })
        .catch((err) => {
          setStripeCleanupError("Network error during account check.");
          console.error("Stripe cleanup fetch error:", err);
        });
    }
    // Only run when user changes
  }, [user, isLoaded]);

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
