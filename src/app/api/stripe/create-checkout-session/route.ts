import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import Stripe from "stripe";

const stripe_secret_key = process.env.STRIPE_SECRET_KEY!;
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabase_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(stripe_secret_key, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { price_id } = await req.json();
    if (!price_id) {
      return NextResponse.json({ error: "Missing price_id" }, { status: 400 });
    }
    // Fetch user from Supabase
    const supabase = createClient(supabase_url, supabase_service_key);
    const { data: user, error: user_error } = await supabase
      .from("users")
      .select("id, stripe_customer_id, email")
      .eq("clerk_id", userId)
      .single();
    if (user_error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!user.stripe_customer_id) {
      return NextResponse.json({ error: "Account issue: Stripe customer not linked. Please contact support." }, { status: 400 });
    }
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer: user.stripe_customer_id,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/buy-tokens?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/buy-tokens?canceled=1`,
      metadata: { price_id },
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 