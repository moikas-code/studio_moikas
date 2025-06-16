import { currentUser } from "@clerk/nextjs/server";
import { get_service_role_client } from "../database/supabase";

export async function check_age_verification(): Promise<{
  is_verified: boolean;
  needs_verification: boolean;
  user_id?: string;
}> {
  try {
    const user = await currentUser();

    if (!user) {
      return { is_verified: false, needs_verification: false };
    }

    // Check Clerk metadata first
    if (user.publicMetadata?.age_verified) {
      return { is_verified: true, needs_verification: false, user_id: user.id };
    }

    // Check database - but handle missing columns gracefully
    const supabase = get_service_role_client();
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_id", user.id)
        .single();

      if (error || !data) {
        return { is_verified: false, needs_verification: true, user_id: user.id };
      }

      // If we can't check age_verified_at column (doesn't exist),
      // fall back to Clerk metadata only
      return {
        is_verified: user.publicMetadata?.age_verified === true,
        needs_verification: user.publicMetadata?.age_verified !== true,
        user_id: user.id,
      };
    } catch (error) {
      console.warn("Database check failed, using Clerk metadata only:", error);
      return {
        is_verified: user.publicMetadata?.age_verified === true,
        needs_verification: user.publicMetadata?.age_verified !== true,
        user_id: user.id,
      };
    }
  } catch (error) {
    console.error("Age verification check failed:", error);
    return { is_verified: false, needs_verification: false };
  }
}

export function get_age_requirement(region?: string): number {
  const EU_COUNTRIES = [
    "AT",
    "BE",
    "BG",
    "HR",
    "CY",
    "CZ",
    "DK",
    "EE",
    "FI",
    "FR",
    "DE",
    "GR",
    "HU",
    "IE",
    "IT",
    "LV",
    "LT",
    "LU",
    "MT",
    "NL",
    "PL",
    "PT",
    "RO",
    "SK",
    "SI",
    "ES",
    "SE",
  ];

  return region && EU_COUNTRIES.includes(region) ? 16 : 13;
}
