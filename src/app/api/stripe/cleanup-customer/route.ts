import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe_secret_key = process.env.STRIPE_SECRET_KEY!;
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabase_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(stripe_secret_key, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { clerk_user_id, email } = await req.json();
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
    // Get current user row
    const { data: user_row, error: user_error } = await supabase
      .from("users")
      .select("id, stripe_customer_id")
      .eq("clerk_id", clerk_user_id)
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