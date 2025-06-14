import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { check_rate_limit } from "@/lib/generate_helpers";
import { auth } from "@clerk/nextjs/server";
import { ensure_user_exists } from "@/lib/utils/api/auth";

const stripe_secret_key = process.env.STRIPE_SECRET_KEY!;
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabase_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(stripe_secret_key, {
  apiVersion: "2025-05-28.basil",
});

const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(req: NextRequest) {
  // Require authentication
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let plan = "free";
  
  // Fetch plan from Supabase
  const supabase = createClient(supabase_url, supabase_service_key);
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();
  if (user && user.id) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();
    if (subscription && subscription.plan) plan = subscription.plan;
  }
  const rate = await check_rate_limit(
    redis,
    userId,
    plan === "standard" ? 60 : 10,
    60
  );
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
  try {
    let body;
    try {
      body = await req.json();
    } catch (json_error) {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }
    
    const { clerk_user_id, email } = body;
    if (!clerk_user_id || !email) {
      return NextResponse.json({ error: "Missing clerk_user_id or email" }, { status: 400 });
    }
    // Find all Stripe customers with this email
    const customers = await stripe.customers.list({ email, limit: 10 });
    if (!customers.data.length) {
      return NextResponse.json({ message: "No Stripe customers found for email" }, { status: 200 });
    }
    // Connect to Supabase
    const supabase = createClient(supabase_url, supabase_service_key);
    
    // Ensure user exists in Supabase
    let user_id: string;
    try {
      user_id = await ensure_user_exists(clerk_user_id, email);
    } catch (error) {
      console.error("Error ensuring user exists:", error);
      return NextResponse.json({ error: "Failed to create/find user" }, { status: 500 });
    }
    
    // Get current user row
    const { data: user_row, error: user_error } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("id", user_id)
      .single();
    if (user_error || !user_row) {
      return NextResponse.json({ error: "User not found in Supabase" }, { status: 404 });
    }
    // Determine primary customer: prefer the one in Supabase, else oldest
    let primary_customer = customers.data.find(
      (c) => c.id === user_row.stripe_customer_id
    );
    if (!primary_customer) {
      primary_customer = customers.data.reduce((oldest, curr) =>
        (!oldest || (curr.created && curr.created < (oldest.created || 0))) ? curr : oldest,
        customers.data[0]
      );
    }
    if (!primary_customer) {
      return NextResponse.json({ error: "Could not determine primary customer" }, { status: 500 });
    }
    // Update Supabase if needed
    if (user_row.stripe_customer_id !== primary_customer.id) {
      await supabase
        .from("users")
        .update({ stripe_customer_id: primary_customer.id })
        .eq("clerk_id", clerk_user_id);
    }
    // Archive (mark) extras
    const archived = [];
    for (const customer of customers.data) {
      if (customer.id !== primary_customer.id) {
        // Mark as archived in metadata
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, archived: "true", merged_to: primary_customer.id },
        });
        archived.push(customer.id);
      }
    }
    return NextResponse.json({
      message: "Cleanup complete",
      primary_customer_id: primary_customer.id,
      archived,
      total_customers: customers.data.length,
    });
  } catch (error) {
    console.error("Stripe cleanup error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 