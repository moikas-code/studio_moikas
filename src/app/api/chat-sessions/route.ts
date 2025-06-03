import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from '@/lib/supabase_server';

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Fetch user's chat sessions with message count
    const { data: sessions, error: sessions_error } = await supabase
      .from("workflow_sessions")
      .select(`
        id,
        name,
        created_at,
        updated_at,
        metadata,
        workflow_messages!inner(id)
      `)
      .eq("user_id", user_row.id)
      .order("updated_at", { ascending: false });

    if (sessions_error) {
      console.error("Error fetching sessions:", sessions_error);
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
    }

    // Transform sessions to include message count
    const formatted_sessions = sessions?.map(session => ({
      id: session.id,
      name: session.name || `Session ${session.id.slice(0, 8)}`,
      created_at: session.created_at,
      updated_at: session.updated_at,
      message_count: session.workflow_messages?.length || 0,
      metadata: session.metadata
    })) || [];

    return NextResponse.json({ sessions: formatted_sessions });

  } catch (error) {
    console.error("Error in chat sessions API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const session_id = searchParams.get("session_id");

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

    // Verify session belongs to user and delete it
    const { error: delete_error } = await supabase
      .from("workflow_sessions")
      .delete()
      .eq("id", session_id)
      .eq("user_id", user_row.id);

    if (delete_error) {
      console.error("Error deleting session:", delete_error);
      return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in delete session API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}