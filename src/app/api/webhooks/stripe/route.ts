import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// Ensure you have 'stripe' and '@types/stripe' installed in your project
import Stripe from "stripe";
import { log_event } from "@/lib/generate_helpers";

// Stripe secret key and webhook secret from environment variables
const stripe_secret_key = process.env.STRIPE_SECRET_KEY!;
const stripe_webhook_secret = process.env.STRIPE_WEBHOOK_SECRET!;
const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabase_service_key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const stripe = new Stripe(stripe_secret_key, {
  apiVersion: "2025-04-30.basil",
});

// Map Stripe price IDs to token amounts
const price_id_to_tokens: Record<string, number> = {
  // Example: 'price_1RRgF7QJcKXoJgq7QczD4a0N': 250,
  // Fill in with your actual Stripe price IDs and token amounts
  prod_SMOj2uZ9YSSDIB: 250,
  prod_SMOkzIx2sykhIT: 1000,
  prod_SMOmkz8PBtRM0l: 3000,
};

async function get_first_price_id_from_session(session: Stripe.Checkout.Session): Promise<string | undefined> {
  // If expanded, use it directly
  if (session.line_items && Array.isArray(session.line_items.data) && session.line_items.data.length > 0) {
    return session.line_items.data[0].price?.id;
  }
  // Otherwise, fetch line items from Stripe
  if (session.id) {
    const line_items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
    if (line_items.data.length > 0) {
      return line_items.data[0].price?.id;
    }
  }
  return undefined;
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const buf = await req.arrayBuffer();
  let event: Stripe.Event;

  log_event("stripe_webhook_received", { headers: Object.fromEntries(req.headers.entries()) });

  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(buf),
      sig!,
      stripe_webhook_secret
    );
  } catch (err: unknown) {
    const error_message = err instanceof Error ? err.message : String(err);
    log_event("stripe_signature_verification_failed", { error_message });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    let price_id = session?.metadata?.price_id;
    if (!price_id) {
      price_id = await get_first_price_id_from_session(session);
    }
    const user_id = session?.metadata?.user_id;

    // Fallback: retrieve by amount if price_id missing
    let tokens_to_add = 0;
    if (price_id && price_id_to_tokens[price_id]) {
      tokens_to_add = price_id_to_tokens[price_id];
    } else if (session?.amount_total) {
      if (session.amount_total === 200) tokens_to_add = 250;
      if (session.amount_total === 600) tokens_to_add = 1000;
      if (session.amount_total === 1600) tokens_to_add = 3000;
    }

    if (!user_id || !tokens_to_add) {
      log_event("stripe_webhook_missing_data", { user_id, tokens_to_add, price_id, session });
      return NextResponse.json({ error: "Missing user_id or tokens_to_add" }, { status: 400 });
    }

    // Update user's permanent tokens in Supabase
    const supabase = createClient(supabase_url, supabase_service_key);
    const { error } = await supabase.rpc('add_permanent_tokens', {
      user_id,
      tokens_to_add,
    });
    if (error) {
      log_event("supabase_token_update_failed", { user_id, tokens_to_add, error });
      return NextResponse.json({ error: "Supabase update failed" }, { status: 500 });
    }

    // Log successful fulfillment
    log_event("token_fulfillment_success", { user_id, tokens_to_add, price_id, session_id: session.id });

    // Placeholder: Send notification (e.g., email, Slack, etc.)
    // await send_notification({ user_id, tokens_to_add, price_id, session_id: session.id });

    // Placeholder: Hook for admin dashboard update (e.g., push to a queue, update a dashboard table)
    // await update_admin_dashboard({ user_id, tokens_to_add, price_id, session_id: session.id });

    return NextResponse.json({ received: true });
  }

  // Log unhandled event types
  log_event("stripe_webhook_unhandled_event", { event_type: event.type });
  return NextResponse.json({ received: true });
}

// Note: You must create a Supabase RPC (function) 'add_permanent_tokens' that increments the permanent_tokens field for the user.
// Example SQL:
// CREATE OR REPLACE FUNCTION add_permanent_tokens(user_id uuid, tokens_to_add integer)
// RETURNS void AS $$
// BEGIN
//   UPDATE subscriptions SET permanent_tokens = COALESCE(permanent_tokens, 0) + tokens_to_add WHERE user_id = user_id;
// END;
// $$ LANGUAGE plpgsql; 