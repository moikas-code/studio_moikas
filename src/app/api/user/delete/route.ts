import { NextRequest } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { handle_api_error, api_success, api_error } from "@/lib/utils/api/response";
import { validate_request } from "@/lib/utils/api/validation";
import { get_service_role_client } from "@/lib/utils/database/supabase";
import { z } from "zod";

const deletion_request_schema = z.object({
  confirmation: z.literal("DELETE MY ACCOUNT"),
  reason: z.string().optional(),
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
    const validated = validate_request(deletion_request_schema, body);

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

    // Create deletion request record
    const deletion_date = new Date();
    deletion_date.setDate(deletion_date.getDate() + 30); // 30 days from now

    const { error: deletion_error } = await supabase.from("user_deletion_requests").insert({
      user_id: user_data.id,
      clerk_id: user.id,
      requested_at: new Date().toISOString(),
      scheduled_deletion_date: deletion_date.toISOString(),
      reason: validated.reason,
      status: "pending",
    });

    if (deletion_error) {
      // Check if deletion request already exists
      if (deletion_error.code === "23505") {
        // Unique violation
        return api_error("Deletion request already exists for this account", 409);
      }
      throw deletion_error;
    }

    // Send confirmation email (using Clerk's email)
    // In production, you'd integrate with an email service
    console.log(
      `Account deletion requested for user ${user.id}, scheduled for ${deletion_date.toISOString()}`
    );

    return api_success({
      message: "Account deletion request received",
      scheduled_deletion_date: deletion_date.toISOString(),
      grace_period_days: 30,
      instructions:
        "Your account will be deleted in 30 days. You can cancel this request by logging in before the deletion date.",
    });
  } catch (error) {
    return handle_api_error(error);
  }
}

// Cancel deletion request
export async function DELETE() {
  try {
    // Get authenticated user
    const user = await currentUser();
    if (!user) {
      return api_error("Unauthorized", 401);
    }

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

    // Cancel pending deletion request
    const { data: deletion_data, error: deletion_error } = await supabase
      .from("user_deletion_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("user_id", user_data.id)
      .eq("status", "pending")
      .select()
      .single();

    if (deletion_error || !deletion_data) {
      return api_error("No pending deletion request found", 404);
    }

    return api_success({
      message: "Account deletion request cancelled successfully",
      original_request_date: deletion_data.requested_at,
    });
  } catch (error) {
    return handle_api_error(error);
  }
}
