import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Constants matching the main API
const MIN_TEXT_COST = 1;

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Light rate limiting for estimation endpoint
    const rate = await check_rate_limit(redis, `${userId}:estimate`, 60, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded for token estimation" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rate.remaining.toString(),
            "X-RateLimit-Reset": rate.reset.toString(),
          },
        }
      );
    }

    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Simple token estimation
    // For more accuracy, you could use the same tokenizer as your AI model
    const character_count = message.length;
    const word_count = message.trim().split(/\s+/).filter(word => word.length > 0).length;
    
    // Rough estimation: ~4 characters per token
    // You can make this more sophisticated by using actual tokenization
    const estimated_tokens = Math.ceil(character_count / 4);
    
    // Calculate estimated cost
    const estimated_cost = Math.max(MIN_TEXT_COST, Math.ceil(estimated_tokens / 3000));

    return NextResponse.json({
      estimated_tokens,
      estimated_cost,
      character_count,
      word_count,
      message: `~${estimated_tokens} tokens (${estimated_cost} MP)`
    });

  } catch (error) {
    console.error("Token estimation error:", error);
    return NextResponse.json(
      { error: "Failed to estimate tokens" },
      { status: 500 }
    );
  }
} 