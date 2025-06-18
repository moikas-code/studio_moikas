import { get_service_role_client } from "@/lib/utils/database/supabase";
import { currentUser } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export interface BanCheckResult {
  is_banned: boolean;
  ban_reason?: string;
  banned_until?: string;
}

export async function check_user_banned(req?: NextRequest): Promise<BanCheckResult> {
  try {
    const user = await currentUser();
    if (!user) {
      return { is_banned: false };
    }

    const supabase = get_service_role_client();

    // Get user's IP address if request is provided
    let ip_address: string | null = null;
    if (req) {
      const forwarded_for = req.headers.get("x-forwarded-for");
      const real_ip = req.headers.get("x-real-ip");
      ip_address = forwarded_for?.split(",")[0] || real_ip || null;
    }

    // Check if user is banned by any identifier
    const { data: ban_check, error } = await supabase.rpc("check_user_banned", {
      check_email: user.emailAddresses?.[0]?.emailAddress || null,
      check_clerk_id: user.id,
      check_ip: ip_address,
      check_fingerprint: null, // Could be added from client-side in future
    });

    if (error) {
      console.error("Failed to check ban status:", error);
      return { is_banned: false };
    }

    if (ban_check && ban_check.length > 0 && ban_check[0].is_banned) {
      return {
        is_banned: true,
        ban_reason: ban_check[0].ban_reason,
        banned_until: ban_check[0].banned_until,
      };
    }

    // Also check if user record has ban metadata
    const { data: user_data } = await supabase
      .from("users")
      .select("metadata")
      .eq("clerk_id", user.id)
      .single();

    if (user_data?.metadata?.banned?.is_banned) {
      return {
        is_banned: true,
        ban_reason: user_data.metadata.banned.ban_reason,
        banned_until: user_data.metadata.banned.banned_until,
      };
    }

    return { is_banned: false };
  } catch (error) {
    console.error("Ban check failed:", error);
    // Fail open - don't block users if ban check fails
    return { is_banned: false };
  }
}
