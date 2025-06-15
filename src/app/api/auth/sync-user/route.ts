import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { get_service_role_client } from "@/lib/utils/database/supabase";
import { handle_api_error } from "@/lib/utils/api/response";

export async function POST() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        error: "Not authenticated"
      }, { status: 401 });
    }

    const supabase = get_service_role_client();
    
    // Get user from Clerk
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    
    if (!email) {
      return NextResponse.json({ 
        error: "No email address found"
      }, { status: 400 });
    }
    
    // Check if user exists in database
    const { data: existing_user, error: user_error } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", userId)
      .single();
      
    let user_id: string;
    
    if (user_error && user_error.code === "PGRST116") {
      // User doesn't exist, create them
      const { data: new_user, error: create_error } = await supabase
        .from("users")
        .insert({
          clerk_id: userId,
          email: email,
          role: 'user'
        })
        .select()
        .single();
        
      if (create_error || !new_user) {
        console.error("Failed to create user:", create_error);
        return NextResponse.json({ 
          error: "Failed to create user"
        }, { status: 500 });
      }
      
      user_id = new_user.id;
    } else if (user_error) {
      console.error("Error checking user:", user_error);
      return NextResponse.json({ 
        error: "Database error"
      }, { status: 500 });
    } else {
      user_id = existing_user.id;
    }
    
    // Check if subscription exists
    const { data: subscription, error: sub_error } = await supabase
      .from("subscriptions")
      .select("id, plan, renewable_tokens, permanent_tokens")
      .eq("user_id", user_id)
      .single();
      
    if (sub_error && sub_error.code === "PGRST116") {
      // Subscription doesn't exist, create it with free plan defaults
      const { error: insert_error } = await supabase
        .from("subscriptions")
        .insert({
          user_id,
          plan: 'free',
          renewable_tokens: 125,
          permanent_tokens: 100,
          renewed_at: new Date().toISOString()
        });
        
      if (insert_error) {
        console.error("Failed to create subscription:", insert_error);
        return NextResponse.json({ 
          error: "Failed to create subscription"
        }, { status: 500 });
      }
    } else if (sub_error) {
      console.error("Error checking subscription:", sub_error);
      return NextResponse.json({ 
        error: "Database error"
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      user_id,
      has_subscription: !!subscription
    });
    
  } catch (error) {
    return handle_api_error(error);
  }
}