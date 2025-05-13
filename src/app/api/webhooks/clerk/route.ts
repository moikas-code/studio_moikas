import { Webhook } from "svix";
import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { UserJSON, WebhookEvent } from "@clerk/nextjs/server";

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
    const data = evt.data as UserJSON;
    const { id: clerkUserId, email_addresses } = data;
    const email = email_addresses?.[0]?.email_address;
    if (!clerkUserId || !email) {
      console.error("Missing clerkUserId or email:", data);
      return NextResponse.json(
        { error: "Invalid webhook data" },
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
        // Upsert user in Supabase
        const { data: userData, error } = await supabase
          .from("users")
          .upsert({ clerk_id: clerkUserId, email }, { onConflict: "clerk_id" })
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
            tokens: 100,
            renewed_at: new Date().toISOString(),
          });

        if (subError) {
          console.error("Error creating subscription:", subError.message);
          throw new Error(`Failed to create subscription: ${subError.message}`);
        }

        console.log(`User created: ${clerkUserId}`);
        break;

      case "user.updated":
        // Update user email if changed
        const { error: updateError } = await supabase
          .from("users")
          .update({ email })
          .eq("clerk_id", clerkUserId);

        if (updateError) {
          console.error("Error updating user:", updateError.message);
          throw new Error(`Failed to update user: ${updateError.message}`);
        }

        console.log(`User updated: ${clerkUserId}`);
        break;

      case "user.deleted":
        // Delete user and related data
        const { data: user, error: fetchError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", clerkUserId)
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
          .eq("clerk_id", clerkUserId);

        if (deleteError) {
          console.error("Error deleting user:", deleteError.message);
          throw new Error(`Failed to delete user: ${deleteError.message}`);
        }

        console.log(`User deleted: ${clerkUserId}`);
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
