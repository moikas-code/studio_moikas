import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { handle_api_error, api_success, api_error } from "@/lib/utils/api/response";
import { validate_request } from "@/lib/utils/api/validation";
import { get_service_role_client } from "@/lib/utils/database/supabase";
import { check_age_verification } from "@/lib/utils/auth/age_verification";
import { z } from "zod";

const age_verification_schema = z.object({
  birth_date: z.string().refine((date) => {
    const parsed = new Date(date);
    const now = new Date();
    // Birth date must be in the past and not more than 150 years ago
    return parsed < now && parsed > new Date(now.getFullYear() - 150, 0, 1);
  }, "Invalid birth date"),
  region: z.string().length(2).optional(), // ISO country code
});

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      return api_error("Unauthorized", 401);
    }

    // Validate request body
    const body = await req.json();
    const validated = validate_request(age_verification_schema, body);

    const supabase = get_service_role_client();

    // Get user's internal ID and email
    const { data: user_data, error: user_error } = await supabase
      .from("users")
      .select("id, email")
      .eq("clerk_id", user.id)
      .single();

    if (user_error || !user_data) {
      return api_error("User not found", 404);
    }

    // Check if user meets age requirement
    const birth_date_obj = new Date(validated.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birth_date_obj.getFullYear();
    const month_diff = today.getMonth() - birth_date_obj.getMonth();

    if (month_diff < 0 || (month_diff === 0 && today.getDate() < birth_date_obj.getDate())) {
      age--;
    }

    // All users must be 18+
    const min_age = 18;

    if (age < min_age) {
      // User is underage - ban them permanently and delete the account
      try {
        // Get user's IP address and other identifiers
        const forwarded_for = req.headers.get("x-forwarded-for");
        const real_ip = req.headers.get("x-real-ip");
        const ip_address = forwarded_for?.split(",")[0] || real_ip || null;

        // Ban the user permanently
        await supabase.rpc("ban_underage_user", {
          user_email: user_data.email || user.emailAddresses?.[0]?.emailAddress || null,
          user_clerk_id: user.id,
          user_ip: ip_address,
          user_fingerprint: null, // Could be added from client-side in future
          user_birth_date: validated.birth_date,
        });
      } catch (ban_error) {
        console.error("Failed to ban underage user:", ban_error);
        // Continue with deletion even if ban fails
      }

      // Delete the account
      await supabase.from("users").delete().eq("id", user_data.id);

      return api_error(
        `You must be at least ${min_age} years old to use Studio Moikas. Your account has been permanently banned.`,
        403
      );
    }

    // Update user record with verified age
    // First, check if the age verification columns exist
    try {
      const { error: update_error } = await supabase
        .from("users")
        .update({
          birth_date: validated.birth_date,
          age_verified_at: new Date().toISOString(),
          region: validated.region || null,
        })
        .eq("id", user_data.id);

      if (update_error) {
        // If columns don't exist, just log it and continue
        console.warn("Failed to update age verification in database:", update_error);
        console.warn("Make sure to run migration: 20250117000000_add_age_verification.sql");
        // Continue - we'll rely on Clerk metadata
      }
    } catch (db_error) {
      console.warn("Database update failed, continuing with Clerk metadata only:", db_error);
    }

    // Update Clerk metadata to mark user as age verified
    try {
      await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_metadata: {
            age_verified: true,
            age_verified_at: new Date().toISOString(),
          },
        }),
      });
    } catch (clerk_error) {
      console.error("Failed to update Clerk metadata:", clerk_error);
      // Continue - age is verified in our database
    }

    return api_success({
      message: "Age verification successful",
      verified: true,
    });
  } catch (error) {
    return handle_api_error(error);
  }
}

export async function GET() {
  try {
    const verification_status = await check_age_verification();

    return api_success({
      verified: verification_status.is_verified,
      needs_verification: verification_status.needs_verification,
      user_id: verification_status.user_id,
    });
  } catch (error) {
    return handle_api_error(error);
  }
}
