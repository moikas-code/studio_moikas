import { NextRequest, NextResponse } from "next/server";
import { generate_flux_image } from "@/lib/fal_client";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { auth } from "@clerk/nextjs/server";

// Helper to calculate required tokens for a given image size
function calculate_required_tokens(width: number, height: number): number {
  const megapixels = (width * height) / 1_000_000;
  // Round down to nearest whole token
  return Math.floor(megapixels);
}

// Helper to get plan limits
function get_plan_limit(plan: string): number {
  if (plan === "hobby") return 500;
  return 100; // default to free
}

// Helper to check if a new month has started
function is_new_month(last_reset: string | null): boolean {
  if (!last_reset) return true;
  const last = new Date(last_reset);
  const now = new Date();
  return (
    last.getUTCFullYear() !== now.getUTCFullYear() ||
    last.getUTCMonth() !== now.getUTCMonth()
  );
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user with Clerk
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { prompt, width = 1024, height = 1024, model_id } = await req.json();
    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const required_tokens = calculate_required_tokens(width, height);

    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();

    // Fetch user and subscription data
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .select("tokens, plan, renewed_at")
      .eq("user_id", user.id)
      .single();

    if (sub_error || !subscription) {
      console.error("Subscription fetch error:", sub_error?.message);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    let { tokens, renewed_at } = subscription;
    const plan = subscription.plan;
    const plan_limit = get_plan_limit(plan);

    // Restrict model access by plan
    let selected_model_id = model_id;
    if (plan === "free") {
      if (!selected_model_id || selected_model_id !== "fal-ai/flux/schnell") {
        selected_model_id = "fal-ai/flux/schnell";
      }
      if (model_id && model_id !== "fal-ai/flux/schnell") {
        return NextResponse.json(
          { error: "Free users can only use fal-ai/flux/schnell" },
          { status: 403 }
        );
      }
    } else if (plan === "hobby") {
      if (!selected_model_id) {
        selected_model_id = "fal-ai/flux/dev";
      }
      if (selected_model_id !== "fal-ai/flux/schnell" && selected_model_id !== "fal-ai/flux/dev") {
        return NextResponse.json(
          { error: "Hobby users can only use fal-ai/flux/schnell or fal-ai/flux/dev" },
          { status: 403 }
        );
      }
    } else {
      // fallback: only allow schnell
      selected_model_id = "fal-ai/flux/schnell";
    }

    // Reset tokens if a new month has started, but only for non-free plans
    if (plan !== "free" && is_new_month(renewed_at)) {
      tokens = plan_limit;
      renewed_at = new Date().toISOString();
      const { error: reset_error } = await supabase
        .from("subscriptions")
        .update({ tokens, renewed_at })
        .eq("user_id", user.id);

      if (reset_error) {
        console.error("Token reset error:", reset_error.message);
        return NextResponse.json(
          { error: "Failed to reset tokens" },
          { status: 500 }
        );
      }
      console.log(`Tokens reset for user ${userId}: ${tokens} tokens`);
    }

    // Deduct tokens atomically using stored procedure
    const { error: deduct_error } = await supabase.rpc("deduct_tokens", {
      p_user_id: user.id,
      p_required_tokens: required_tokens,
    });

    if (deduct_error) {
      console.error("Token deduction error:", deduct_error.message);
      if (deduct_error.message.includes("Insufficient tokens")) {
        return NextResponse.json(
          { error: "Insufficient tokens" },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: "Failed to deduct tokens" },
        { status: 500 }
      );
    }

    // Generate the image
    const image = await generate_flux_image(prompt, width, height, selected_model_id);
    const base64 = Buffer.from(image.uint8Array).toString("base64");

    return NextResponse.json({ image_base64: base64, mp_used: required_tokens });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Image generation error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unknown image generation error:", error);
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
