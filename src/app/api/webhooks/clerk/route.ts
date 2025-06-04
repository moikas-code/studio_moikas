import { NextRequest } from "next/server"
import { headers } from "next/headers"
import { Webhook } from 'svix'
import { 
  get_service_role_client,
  execute_db_operation 
} from "@/lib/utils/database/supabase"
import { 
  api_success, 
  api_error, 
  handle_api_error 
} from "@/lib/utils/api/response"
import { z } from "zod"

// Next.js route configuration
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Webhook event schema
const clerk_event_schema = z.object({
  data: z.object({
    id: z.string(),
    email_addresses: z.array(z.object({
      email_address: z.string().email()
    })).optional(),
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
  }),
  type: z.string()
})

export async function POST(req: NextRequest) {
  try {
    // 1. Get webhook secret
    const webhook_secret = process.env.CLERK_WEBHOOK_SECRET
    if (!webhook_secret) {
      throw new Error('Missing CLERK_WEBHOOK_SECRET')
    }
    
    // 2. Get headers
    const header_payload = await headers()
    const svix_id = header_payload.get('svix-id')
    const svix_timestamp = header_payload.get('svix-timestamp')
    const svix_signature = header_payload.get('svix-signature')
    
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return api_error('Missing svix headers', 400)
    }
    
    // 3. Get body
    const payload = await req.json()
    const body = JSON.stringify(payload)
    
    // 4. Verify webhook signature
    const wh = new Webhook(webhook_secret)
    let evt: any
    
    try {
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      })
    } catch (err) {
      console.error('Webhook verification failed:', err)
      return api_error('Invalid signature', 400)
    }
    
    // 5. Validate event data
    const validated = clerk_event_schema.parse(evt)
    
    // 6. Handle different event types
    const supabase = get_service_role_client()
    
    switch (validated.type) {
      case 'user.created':
      case 'user.updated': {
        const clerk_id = validated.data.id
        const email = validated.data.email_addresses?.[0]?.email_address
        
        if (!email) {
          console.error('No email found for user:', clerk_id)
          break
        }
        
        // Check if user exists
        const { data: existing_user } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerk_id)
          .single()
        
        if (!existing_user) {
          // Create new user and subscription
          await execute_db_operation(async () => {
            // Create user
            const { data: new_user, error: user_error } = await supabase
              .from('users')
              .insert({
                clerk_id,
                email,
                created_at: new Date().toISOString()
              })
              .select()
              .single()
            
            if (user_error) throw user_error
            
            // Create subscription
            const { error: sub_error } = await supabase
              .from('subscriptions')
              .insert({
                user_id: new_user.id,
                plan_name: 'free',
                renewable_tokens: 125,
                permanent_tokens: 0,
                created_at: new Date().toISOString()
              })
            
            if (sub_error) throw sub_error
          })
        } else {
          // Update existing user
          await execute_db_operation(() =>
            supabase
              .from('users')
              .update({
                email,
                updated_at: new Date().toISOString()
              })
              .eq('clerk_id', clerk_id)
          )
        }
        break
      }
      
      case 'user.deleted': {
        // Soft delete user
        const clerk_id = validated.data.id
        
        await execute_db_operation(() =>
          supabase
            .from('users')
            .update({
              deleted_at: new Date().toISOString()
            })
            .eq('clerk_id', clerk_id)
        )
        break
      }
      
      default:
        console.log(`Unhandled Clerk event type: ${validated.type}`)
    }
    
    // 7. Return success
    return api_success({ received: true })
    
  } catch (error) {
    console.error('Clerk webhook error:', error)
    return handle_api_error(error)
  }
}