import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { track } from "@vercel/analytics/server";
import { fal } from "@fal-ai/client";

// Available image editing operations
const EDITING_OPERATIONS = {
  REMOVE_BACKGROUND: "remove_background",
  ENHANCE_IMAGE: "enhance_image", 
  UPSCALE_IMAGE: "upscale_image",
  STYLE_TRANSFER: "style_transfer",
  COLORIZE: "colorize",
  RESTORE: "restore",
} as const;

type Editing_operation = typeof EDITING_OPERATIONS[keyof typeof EDITING_OPERATIONS];

interface Image_edit_request {
  operation: Editing_operation;
  image_base64: string;
  options?: {
    scale_factor?: number;
    style_prompt?: string;
    enhancement_type?: string;
    [key: string]: unknown;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request
    const { operation, image_base64, options = {} }: Image_edit_request = await req.json();

    if (!operation || !image_base64) {
      return NextResponse.json(
        { error: "Operation and image are required" },
        { status: 400 }
      );
    }

    // Validate operation
    if (!Object.values(EDITING_OPERATIONS).includes(operation)) {
      return NextResponse.json(
        { error: "Invalid operation" },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = await create_clerk_supabase_client_ssr();

    // Get user data
    const { data: user_data, error: user_error } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user_data) {
      console.error("User fetch error:", user_error?.message);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get subscription data
    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .select("plan, renewable_tokens, permanent_tokens")
      .eq("user_id", user_data.id)
      .single();

    if (sub_error || !subscription) {
      console.error("Subscription fetch error:", sub_error?.message);
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Calculate MP cost based on operation
    const mp_cost = get_operation_cost(operation);
    const total_tokens = (subscription.renewable_tokens || 0) + (subscription.permanent_tokens || 0);

    if (total_tokens < mp_cost) {
      return NextResponse.json(
        {
          error: "Insufficient MP tokens",
          required: mp_cost,
          available: total_tokens,
        },
        { status: 402 }
      );
    }

    // Deduct tokens before processing
    const new_renewable = Math.max(0, (subscription.renewable_tokens || 0) - mp_cost);
    const remaining_cost = mp_cost - ((subscription.renewable_tokens || 0) - new_renewable);
    const new_permanent = Math.max(0, (subscription.permanent_tokens || 0) - remaining_cost);

    const { error: update_error } = await supabase
      .from("subscriptions")
      .update({
        renewable_tokens: new_renewable,
        permanent_tokens: new_permanent,
      })
      .eq("user_id", user_data.id);

    if (update_error) {
      console.error("Token deduction error:", update_error.message);
      return NextResponse.json(
        { error: "Failed to deduct tokens" },
        { status: 500 }
      );
    }

    try {
      // Process image based on operation
      let result_url: string;
      
      switch (operation) {
        case EDITING_OPERATIONS.REMOVE_BACKGROUND:
          result_url = await remove_background(image_base64);
          break;
        case EDITING_OPERATIONS.ENHANCE_IMAGE:
          result_url = await enhance_image(image_base64, options);
          break;
        case EDITING_OPERATIONS.UPSCALE_IMAGE:
          result_url = await upscale_image(image_base64, options);
          break;
        case EDITING_OPERATIONS.STYLE_TRANSFER:
          result_url = await apply_style_transfer(image_base64, options);
          break;
        case EDITING_OPERATIONS.COLORIZE:
          result_url = await colorize_image(image_base64);
          break;
        case EDITING_OPERATIONS.RESTORE:
          result_url = await restore_image(image_base64);
          break;
        default:
          throw new Error("Unsupported operation");
      }

      // Convert result URL to base64
      const response = await fetch(result_url);
      const array_buffer = await response.arrayBuffer();
      const result_base64 = Buffer.from(array_buffer).toString("base64");

      // Track successful operation
      await track("Image Editor Operation", {
        operation,
        plan: subscription.plan || "free",
        mp_cost,
        success: true,
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        image_base64: result_base64,
        mp_used: mp_cost,
        operation,
      });

    } catch (processing_error) {
      // Refund tokens on processing failure
      await supabase
        .from("subscriptions")
        .update({
          renewable_tokens: subscription.renewable_tokens,
          permanent_tokens: subscription.permanent_tokens,
        })
        .eq("user_id", user_data.id);

      console.error("Image processing error:", processing_error);
      
      await track("Image Editor Operation", {
        operation,
        plan: subscription.plan || "free",
        mp_cost,
        success: false,
        error: processing_error instanceof Error ? processing_error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json(
        { 
          error: "Image processing failed", 
          details: processing_error instanceof Error ? processing_error.message : "Unknown error"
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Image editor API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper functions for different operations
async function remove_background(image_base64: string): Promise<string> {
  // Upload image to FAL storage
  const buffer = Buffer.from(image_base64, "base64");
  const file = new File([buffer], "image.png", { type: "image/png" });
  const image_url = await fal.storage.upload(file);

  // Use FAL.AI background removal model
  const result = await fal.subscribe("fal-ai/imageutils/rembg", {
    input: {
      image_url,
    },
  });

  return result.data.image.url;
}

async function enhance_image(image_base64: string, options: Record<string, unknown>): Promise<string> {
  const buffer = Buffer.from(image_base64, "base64");
  const file = new File([buffer], "image.png", { type: "image/png" });
  const image_url = await fal.storage.upload(file);

  // Use ESRGAN or similar enhancement model
  const result = await fal.subscribe("fal-ai/clarity-upscaler", {
    input: {
      image_url,
      upscale_factor: (options.scale_factor as number) || 2,
    },
  });

  return result.data.image.url;
}

async function upscale_image(image_base64: string, options: Record<string, unknown>): Promise<string> {
  const buffer = Buffer.from(image_base64, "base64");
  const file = new File([buffer], "image.png", { type: "image/png" });
  const image_url = await fal.storage.upload(file);

  const result = await fal.subscribe("fal-ai/clarity-upscaler", {
    input: {
      image_url,
      upscale_factor: (options.scale_factor as number) || 2,
    },
  });

  return result.data.image.url;
}

async function apply_style_transfer(image_base64: string, options: Record<string, unknown>): Promise<string> {
  const buffer = Buffer.from(image_base64, "base64");
  const file = new File([buffer], "image.png", { type: "image/png" });
  const image_url = await fal.storage.upload(file);

  // Use style transfer model (you might need to replace with actual available model)
  const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
    input: {
      image_url,
      prompt: (options.style_prompt as string) || "artistic style transfer",
      strength: 0.7,
    },
  });

  return result.data.images[0].url;
}

async function colorize_image(image_base64: string): Promise<string> {
  const buffer = Buffer.from(image_base64, "base64");
  const file = new File([buffer], "image.png", { type: "image/png" });
  const image_url = await fal.storage.upload(file);

  // Use colorization model
  const result = await fal.subscribe("fal-ai/flux/dev/image-to-image", {
    input: {
      image_url,
      prompt: "colorize this black and white image with natural colors",
      strength: 0.8,
    },
  });

  return result.data.images[0].url;
}

async function restore_image(image_base64: string): Promise<string> {
  const buffer = Buffer.from(image_base64, "base64");
  const file = new File([buffer], "image.png", { type: "image/png" });
  const image_url = await fal.storage.upload(file);

  // Use restoration model
  const result = await fal.subscribe("fal-ai/clarity-upscaler", {
    input: {
      image_url,
      upscale_factor: 1,
    },
  });

  return result.data.image.url;
}

function get_operation_cost(operation: Editing_operation): number {
  const costs = {
    [EDITING_OPERATIONS.REMOVE_BACKGROUND]: 5,
    [EDITING_OPERATIONS.ENHANCE_IMAGE]: 8,
    [EDITING_OPERATIONS.UPSCALE_IMAGE]: 10,
    [EDITING_OPERATIONS.STYLE_TRANSFER]: 12,
    [EDITING_OPERATIONS.COLORIZE]: 8,
    [EDITING_OPERATIONS.RESTORE]: 6,
  };

  return costs[operation] || 5;
} 