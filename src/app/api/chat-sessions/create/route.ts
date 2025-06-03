import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from '@/lib/supabase_server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

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

    // Create new session
    const { data: new_session, error: session_error } = await supabase
      .from("workflow_sessions")
      .insert({
        user_id: user_row.id,
        name: name || `New Session ${new Date().toLocaleDateString()}`,
        status: 'active',
        metadata: { tool_type: 'text_analyzer' }
      })
      .select()
      .single();

    if (session_error) {
      console.error("Error creating session:", session_error);
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
    }

    return NextResponse.json({ 
      session: {
        id: new_session.id,
        name: new_session.name,
        created_at: new_session.created_at,
        updated_at: new_session.updated_at,
        message_count: 0
      }
    });

  } catch (error) {
    console.error("Error in create session API:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}