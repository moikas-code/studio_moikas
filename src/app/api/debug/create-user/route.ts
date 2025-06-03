import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { create_clerk_supabase_client_ssr } from "@/lib/supabase_server";

export async function GET(_req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated. Please sign in first." }, { status: 401 });
    }

    const supabase = await create_clerk_supabase_client_ssr();
    
    // Check if user already exists
    const { data: existing_user } = await supabase
      .from("users")
      .select("id, clerk_id, email")
      .eq("clerk_id", userId)
      .single();

    if (existing_user) {
      return NextResponse.json({ 
        message: "User already exists",
        user: existing_user 
      });
    }

    // Create new user
    const { data: new_user, error: user_error } = await supabase
      .from("users")
      .insert({
        clerk_id: userId,
        email: `${userId}@clerk.local`, // Placeholder email for local dev
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (user_error) {
      console.error("Error creating user:", user_error);
      return NextResponse.json({ error: "Failed to create user", details: user_error }, { status: 500 });
    }

    // Create subscription
    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .insert({
        user_id: new_user.id,
        plan_type: "free",
        tokens_renewable: 125,
        tokens_permanent: 0,
        renewed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sub_error) {
      console.error("Error creating subscription:", sub_error);
      return NextResponse.json({ 
        warning: "User created but subscription failed", 
        user: new_user,
        error: sub_error 
      }, { status: 206 });
    }

    return NextResponse.json({ 
      message: "User and subscription created successfully",
      user: new_user,
      subscription
    });

  } catch (error) {
    console.error("Debug create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}