import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { WebhookEvent } from "@clerk/nextjs/server";
import { track } from '@vercel/analytics/server';

export async function POST(req: Request) {
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
      throw new Error("Missing Clerk webhook signing secret");
    }
    // Get Svix headers
    const header_payload = await headers();
    const svix_id = header_payload.get("svix-id");
    const svix_timestamp = header_payload.get("svix-timestamp");
    const svix_signature = header_payload.get("svix-signature");
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response("Error: Missing svix headers", { status: 400 });
    }
    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);
    // Verify webhook
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt: WebhookEvent;
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error("Error verifying webhook:", err);
      return new Response("Error verifying webhook", { status: 400 });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = evt.data as any;
    if (data.object !== "user") {
      console.log("Ignoring non-user event:", data.object);
      return NextResponse.json(
        { message: "Ignored non-user event" },
        { status: 200 }
      );
    }
    const { id: clerk_user_id, email_addresses } = data;
    const email = email_addresses?.[0]?.email_address;

    if (!clerk_user_id) {
      console.error("Missing clerk_user_id:", data);
      return NextResponse.json(
        { error: "Invalid webhook data: missing clerk_user_id" },
        { status: 400 }
      );
    }

    // Only require email for creation and update events
    if (
      (evt.type === "user.created" || evt.type === "user.updated") &&
      !email
    ) {
      console.error("Missing email for event:", evt.type, data);
      return NextResponse.json(
        { error: "Invalid webhook data: missing email" },
        { status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    switch (evt.type) {
      case "user.created":
        const now = new Date().toISOString();
        // Upsert user in Supabase
        const { data: userData, error } = await supabase
          .from("users")
          .upsert({ clerk_id: clerk_user_id, email, created_at: now }, { onConflict: "clerk_id" })
          .select()
          .single();

        if (error) {
          console.error("Error creating user:", error.message);
          throw new Error(`Failed to create user: ${error.message}`);
        }

        // Initialize subscription for new user
        const { error: subError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userData.id,
            plan: "free",
            permanent_tokens: 100,
            renewable_tokens: 0,
            renewed_at: now,
          });

        if (subError) {
          console.error("Error creating subscription:", subError.message);
          throw new Error(`Failed to create subscription: ${subError.message}`);
        }

        // console.log(`User created: ${clerk_user_id}`);
        await track('User Created', {
          event_type: 'user.created',
          timestamp: new Date().toISOString(),
        });
        break;

      case "user.updated":
        // Update user email if changed
        const { error: updateError } = await supabase
          .from("users")
          .update({ email })
          .eq("clerk_id", clerk_user_id);

        if (updateError) {
          console.error("Error updating user:", updateError.message);
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        // --- PLAN SYNC LOGIC ---
        // Try to get plan from Clerk's public_metadata or custom field
        let plan = "free";
        if (data.public_metadata && typeof data.public_metadata.plan === "string") {
          plan = data.public_metadata.plan;
        } else if (data.private_metadata && typeof data.private_metadata.plan === "string") {
          plan = data.private_metadata.plan;
        }
        // Fetch user_id from Supabase
        const { data: user_row, error: user_row_error } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerk_user_id)
          .single();
        if (!user_row_error && user_row?.id) {
          // Update subscription plan in Supabase
          let update_fields: any = { plan, renewed_at: new Date().toISOString() };
          if (plan === "standard") {
            update_fields.renewable_tokens = 4000;
          } else {
            update_fields.permanent_tokens = 100;
          }
          const { error: sub_update_error } = await supabase
            .from("subscriptions")
            .update(update_fields)
            .eq("user_id", user_row.id);
          if (sub_update_error) {
            console.error("Error updating subscription plan:", sub_update_error.message);
          } else {
            console.log(`Updated subscription plan for user ${clerk_user_id} to ${plan}`);
          }
        } else {
          console.error("Could not find user for plan update", user_row_error?.message);
        }
        // --- END PLAN SYNC LOGIC ---

        console.log(`User updated: ${clerk_user_id}`);
        await track('User Updated', {
          event_type: 'user.updated',
          timestamp: new Date().toISOString(),
        });
        break;

      case "user.deleted":
        // Delete user and related data
        const { data: user, error: fetchError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerk_user_id)
          .single();

        if (fetchError || !user) {
          console.error("User not found:", fetchError?.message || "No user");
          throw new Error("User not found");
        }

        // Delete subscriptions and usage
        await supabase.from("subscriptions").delete().eq("user_id", user.id);
        await supabase.from("usage").delete().eq("user_id", user.id);

        // Delete user
        const { error: deleteError } = await supabase
          .from("users")
          .delete()
          .eq("clerk_id", clerk_user_id);

        if (deleteError) {
          console.error("Error deleting user:", deleteError.message);
          throw new Error(`Failed to delete user: ${deleteError.message}`);
        }

        console.log(`User deleted: ${clerk_user_id}`);
        await track('User Deleted', {
          event_type: 'user.deleted',
          timestamp: new Date().toISOString(),
        });
        break;

      default:
        console.log(`Unhandled event type: ${evt.type}`);
    }

    return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Webhook error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Unknown webhook error:", error);
    return NextResponse.json({ error: "Unknown error" }, { status: 400 });
  }
}
