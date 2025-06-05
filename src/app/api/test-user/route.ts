import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Not authenticated",
        clerk_user_id: null 
      }, { status: 401 });
    }

    // Use service role client to check user existence
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Check if user exists in database
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        clerk_id,
        email,
        created_at,
        subscriptions (
          plan,
          tokens_renewable,
          tokens_permanent
        )
      `)
      .eq("clerk_id", userId)
      .single();

    return NextResponse.json({
      clerk_user_id: userId,
      user_exists: !!user,
      user_data: user,
      error: error?.message || null
    });

  } catch (error) {
    console.error("Test user error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}