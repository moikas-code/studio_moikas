import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { rating, feedback, username } = await req.json();
    if (
      !rating ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5 ||
      !feedback ||
      typeof feedback !== "string" ||
      feedback.length === 0 ||
      feedback.length > 500 ||
      !username ||
      typeof username !== "string"
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }
    const webhook_url = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
    if (!webhook_url) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }
    const discord_payload = {
      embeds: [
        {
          title: `New Feedback (${rating} star${rating > 1 ? 's' : ''})`,
          description: feedback,
          color: 0xfacc15, // yellow
          fields: [
            { name: "User", value: username, inline: true },
            { name: "Rating", value: `${rating} / 5`, inline: true },
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