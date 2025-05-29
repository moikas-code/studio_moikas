import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
    const { userId } = await auth();
    let rate;
    if (userId) {
      // Authenticated user: rate limit by userId
      rate = await check_rate_limit(redis, userId, 10, 60); // 10/min default
    } else {
      // Fallback to IP-based limiting
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
      rate = await check_rate_limit(redis, ip, 10, 60);
    }
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again soon." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": rate.remaining.toString(),
            "X-RateLimit-Reset": rate.reset.toString(),
          },
        }
      );
    }
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { category, description, username } = await req.json();
    if (
      !category ||
      typeof category !== "string" ||
      !description ||
      typeof description !== "string" ||
      description.length === 0 ||
      description.length > 500 ||
      !username ||
      typeof username !== "string"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const webhook_url = process.env.DISCORD_BUG_WEBHOOK_URL;
    if (!webhook_url) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    const discord_payload = {
      embeds: [
        {
          title: `New Bug Report (${category})`,
          description: description,
          color: 0xef4444, // red
          fields: [
            { name: "User", value: username, inline: true },
            { name: "Category", value: category, inline: true },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };
    const discord_res = await fetch(webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discord_payload),
    });
    if (!discord_res.ok) {
      return NextResponse.json({ error: "Failed to send to Discord" }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 