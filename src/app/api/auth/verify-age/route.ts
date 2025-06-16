import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { handle_api_error, api_success, api_error } from "@/lib/utils/api/response";
import { validate_request } from "@/lib/utils/api/validation";
import { get_service_role_client } from "@/lib/utils/database/supabase";
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

    // Get user's internal ID
    const { data: user_data, error: user_error } = await supabase
      .from("users")
      .select("id")
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

    // Determine minimum age based on region
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
    const min_age = validated.region && EU_COUNTRIES.includes(validated.region) ? 16 : 13;

    if (age < min_age) {
      // User is underage - delete the account
      await supabase.from("users").delete().eq("id", user_data.id);

      return api_error(`You must be at least ${min_age} years old to use Studio Moikas`, 403);
    }

    // Update user record with verified age
    const { error: update_error } = await supabase
      .from("users")
      .update({
        birth_date: validated.birth_date,
        age_verified_at: new Date().toISOString(),
        region: validated.region || null,
      })
      .eq("id", user_data.id);

    if (update_error) {
      throw update_error;
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
