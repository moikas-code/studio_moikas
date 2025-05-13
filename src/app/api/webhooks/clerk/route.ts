import { verifyWebhook, WebhookEvent } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Verify webhook signature
    const evt = await verifyWebhook(req, {
      signingSecret: process.env.CLERK_WEBHOOK_SIGNING_SECRET!,
    });

    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { id: clerkUserId, email_addresses } = evt.data;
    const email = email_addresses?.[0]?.email_address;

    if (!clerkUserId || !email) {
      console.error("Missing clerkUserId or email:", evt.data);
      return NextResponse.json(
        { error: "Invalid webhook data" },
        { status: 400 }
      );
    }

    switch (evt.type) {
      case "user.created":
        // Upsert user in Supabase
        const { data, error } = await supabase
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
            user_id: data.id,
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
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
