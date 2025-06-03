import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId, 20, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const supabase = await create_clerk_supabase_client_ssr();

    // Get user
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's sessions with message counts and latest message
    const { data: sessions, error } = await supabase
      .from("workflow_sessions")
      .select(`
        id,
        name,
        workflow_id,
        created_at,
        updated_at,
        metadata,
        workflow_messages (
          id,
          content,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching sessions:", error);
      return NextResponse.json(
        { error: "Failed to fetch sessions" },
        { status: 500 }
      );
    }

    // Transform sessions to include message count and preview
    const enriched_sessions = sessions?.map(session => {
      const messages = session.workflow_messages || [];
      const last_message = messages[messages.length - 1];
      
      return {
        id: session.id,
        name: session.name || "Chat Session",
        workflow_id: session.workflow_id,
        created_at: session.created_at,
        updated_at: session.updated_at,
        message_count: messages.length,
        last_message_preview: last_message?.content?.substring(0, 100) || "",
        last_message_date: last_message?.created_at || session.created_at
      };
    }) || [];

    return NextResponse.json({ sessions: enriched_sessions });

  } catch (error) {
    console.error("GET sessions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const session_id = url.searchParams.get("session_id");

    if (!session_id) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const rate = await check_rate_limit(redis, userId, 10, 60);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    const supabase = await create_clerk_supabase_client_ssr();

    // Get user
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete session (messages will cascade delete)
    const { error: delete_error } = await supabase
      .from("workflow_sessions")
      .delete()
      .eq("id", session_id)
      .eq("user_id", user.id);

    if (delete_error) {
      console.error("Error deleting session:", delete_error);
      return NextResponse.json(
        { error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("DELETE session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}