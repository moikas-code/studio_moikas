import { NextRequest } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import { 
  get_service_role_client
} from "@/lib/utils/database/supabase"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 30 // Webhooks may need time to process

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil'
})

const webhook_secret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    // 1. Get raw body for signature verification
    const body = await req.text()
    
    // 2. Get signature header
    const header_list = await headers()
    const signature = header_list.get('stripe-signature')
    
    if (!signature) {
      return api_error('Missing stripe-signature header', 400)
    }
    
    // 3. Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhook_secret
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return api_error('Invalid signature', 400)
    }
    
    // 4. Handle different event types
    const supabase = get_service_role_client()
    
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update user subscription
        if (session.customer && session.metadata?.user_id) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              stripe_customer_id: session.customer,
              plan_name: session.metadata?.plan || 'standard',
              status: 'active'
            })
            .eq('user_id', session.metadata?.user_id || '')
          
          if (error) {
            throw new Error(`Failed to update subscription: ${error.message}`)
          }
        }
        break
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Update subscription status
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_end: 'current_period_end' in subscription 
              ? new Date((subscription as { current_period_end: number }).current_period_end * 1000).toISOString()
              : new Date().toISOString()
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          throw new Error(`Failed to update subscription status: ${error.message}`)
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Cancel subscription
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            plan_name: 'free'
          })
          .eq('stripe_subscription_id', subscription.id)
        
        if (error) {
          throw new Error(`Failed to cancel subscription: ${error.message}`)
        }
        break
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        
        // Add tokens for successful payment
        if (invoice.metadata?.user_id && invoice.metadata?.tokens) {
          const token_amount = parseInt(invoice.metadata.tokens)
          
          // Add permanent tokens - first get current value, then increment
          const { data: current_subscription, error: fetch_error } = await supabase
            .from('subscriptions')
            .select('permanent_tokens')
            .eq('user_id', invoice.metadata!.user_id)
            .single()
          
          if (fetch_error) {
            throw new Error(`Failed to fetch current subscription: ${fetch_error.message}`)
          }

          const new_permanent_tokens = (current_subscription?.permanent_tokens || 0) + token_amount
          const { error: add_error } = await supabase
            .from('subscriptions')
            .update({
              permanent_tokens: new_permanent_tokens
            })
            .eq('user_id', invoice.metadata!.user_id)

          if (add_error) {
            throw new Error(`Failed to add tokens: ${add_error.message}`)
          }

          // Log to revenue_transactions table only
          await supabase
            .from('revenue_transactions')
            .insert({
                user_id: invoice.metadata!.user_id,
                operation: 'token_purchase',
                amount_cents: invoice.amount_paid,
                tokens_amount: token_amount,
                currency: invoice.currency,
                description: `Purchase of ${token_amount} MP tokens`,
                stripe_invoice_id: invoice.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                metadata: {
                  invoice_number: invoice.number,
                  customer_email: invoice.customer_email
                }
              })
        }
        break
      }
      
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
    
    // 5. Return success
    return api_success({ received: true })
    
  } catch (error) {
    console.error('Webhook error:', error)
    return handle_api_error(error)
  }
}