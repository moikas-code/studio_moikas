import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from '@/lib/supabase_server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ session_id: string }> }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { session_id } = await params;

    if (!session_id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Get user ID from Clerk ID
    const { data: user_row, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();

    if (user_error || !user_row?.id) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify session belongs to user
    const { data: session, error: session_error } = await supabase
      .from("workflow_sessions")
      .select("id, name")
      .eq("id", session_id)
      .eq("user_id", user_row.id)
      .single();

    if (session_error || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Fetch messages for the session
    const { data: messages, error: messages_error } = await supabase
      .from("workflow_messages")
      .select("id, role, content, created_at, metadata")
      .eq("session_id", session_id)
      .order("created_at", { ascending: true });

    if (messages_error) {
      console.error("Error fetching messages:", messages_error);
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
    }

    return NextResponse.json({ 
      session: {
        id: session.id,
        name: session.name || `Session ${session.id.slice(0, 8)}`
      },
      messages: messages || []
    });

  } catch (error) {
    console.error("Error in chat messages API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}