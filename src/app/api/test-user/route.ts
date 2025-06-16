import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * @deprecated Use /api/auth/me instead
 * This endpoint returns the current authenticated user's data
 * Kept for backward compatibility
 */
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
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id, clerk_id, email, role, created_at")
      .eq("clerk_id", userId)
      .single();
      
    if (user_error || !user) {
      return NextResponse.json({
        data: {
          tokens: 0,
          renewable_tokens: 0,
          permanent_tokens: 0,
          plan: 'free',
          error: user_error?.message || "User not found"
        }
      });
    }
    
    // Get subscription data
    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .select("plan, renewable_tokens, permanent_tokens")
      .eq("user_id", user.id)
      .single();
      
    if (sub_error || !subscription) {
      return NextResponse.json({
        data: {
          tokens: 0,
          renewable_tokens: 0,
          permanent_tokens: 0,
          plan: 'free',
          error: sub_error?.message || "No subscription found"
        }
      });
    }

    const renewable = subscription.renewable_tokens || 0;
    const permanent = subscription.permanent_tokens || 0;
    
    return NextResponse.json({
      data: {
        tokens: renewable + permanent,
        renewable_tokens: renewable,
        permanent_tokens: permanent,
        plan: subscription.plan || 'free',
        user_id: user.id,
        clerk_id: userId,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Test user error:", error);
    return NextResponse.json({
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}