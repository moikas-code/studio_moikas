import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe_secret_key = process.env.STRIPE_SECRET_KEY!;
const stripe = new Stripe(stripe_secret_key, {
  apiVersion: "2025-04-30.basil",
});

export async function POST(req: NextRequest) {
  try {
    const { product_ids } = await req.json();
    if (!Array.isArray(product_ids) || product_ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid product_ids" }, { status: 400 });
    }
    const products = [];
    for (const product_id of product_ids) {
      const product_result = await stripe.products.retrieve(product_id);
      if (!product_result || typeof product_result !== "object") {
        return NextResponse.json({ error: `Product not found: ${product_id}` }, { status: 404 });
      }
      const product = product_result as Stripe.Product;
      if (typeof product.deleted !== "undefined" && product.deleted === true) {
        return NextResponse.json({ error: `Product not found: ${product_id}` }, { status: 404 });
      }
      // Get the default price for the product
      let price: Stripe.Price | undefined;
      if (typeof product.default_price === "string") {
        const price_result = await stripe.prices.retrieve(product.default_price);
        if (!price_result || typeof price_result !== "object") {
          return NextResponse.json({ error: `Price not found for product: ${product_id}` }, { status: 404 });
        }
        price = price_result as Stripe.Price;
      } else if (product.default_price && typeof product.default_price === "object") {
        price = product.default_price as Stripe.Price;
      } else {
        // Fallback: get the first price
        const prices = await stripe.prices.list({ product: product_id, limit: 1 });
        price = prices.data[0];
      }
      if (typeof price?.deleted !== "undefined" && price?.deleted === true) {
        return NextResponse.json({ error: `Price not found for product: ${product_id}` }, { status: 404 });
      }
      products.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: (price.unit_amount || 0) / 100,
        price_id: price.id,
        currency: price.currency,
        metadata: product.metadata,
      });
    }
    return NextResponse.json({ products });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
} 