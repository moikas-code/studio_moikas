import { NextRequest } from "next/server"
import { currentUser } from "@clerk/nextjs/server"
import { 
  handle_api_error
} from "@/lib/utils/api/response"
import {
  get_service_role_client
} from "@/lib/utils/database/supabase"

export async function GET() {
  try {
    // Get authenticated user
    const user = await currentUser()
    if (!user) {
      return handle_api_error(new Error("Unauthorized"), "UNAUTHORIZED", 401)
    }

    const supabase = get_service_role_client()
    
    // Get user's internal ID
    const { data: user_data, error: user_error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', user.id)
      .single()
    
    if (user_error || !user_data) {
      return handle_api_error(
        new Error("User not found"),
        "USER_NOT_FOUND",
        404
      )
    }

    // Collect all user data
    const export_data: Record<string, unknown> = {
      export_date: new Date().toISOString(),
      user_profile: {
        id: user_data.id,
        clerk_id: user_data.clerk_id,
        created_at: user_data.created_at,
        birth_date: user_data.birth_date,
        region: user_data.region,
        age_verified_at: user_data.age_verified_at
      }
    }

    // Get subscription data
    const { data: subscription_data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user_data.id)
      .single()
    
    if (subscription_data) {
      export_data.subscription = {
        plan: subscription_data.plan,
        renewable_tokens: subscription_data.renewable_tokens,
        permanent_tokens: subscription_data.permanent_tokens,
        created_at: subscription_data.created_at,
        updated_at: subscription_data.updated_at
      }
    }

    // Get usage history
    const { data: usage_data } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', user_data.id)
      .order('created_at', { ascending: false })
      .limit(1000) // Last 1000 usage records
    
    export_data.usage_history = usage_data || []

    // Get image generation history
    const { data: image_jobs } = await supabase
      .from('image_jobs')
      .select('id, model, width, height, aspect_ratio, created_at, completed_at, status')
      .eq('user_id', user_data.id)
      .order('created_at', { ascending: false })
      .limit(500)
    
    export_data.image_generations = image_jobs || []

    // Get video jobs
    const { data: video_jobs } = await supabase
      .from('video_jobs')
      .select('id, model, status, created_at, completed_at')
      .eq('user_id', user_data.id)
      .order('created_at', { ascending: false })
      .limit(100)
    
    export_data.video_generations = video_jobs || []

    // Get audio jobs
    const { data: audio_jobs } = await supabase
      .from('audio_jobs')
      .select('id, job_type, status, created_at, completed_at')
      .eq('user_id', user_data.id)
      .order('created_at', { ascending: false })
      .limit(100)
    
    export_data.audio_generations = audio_jobs || []

    // Get moderation logs (only false positive reports)
    const { data: moderation_logs } = await supabase
      .from('moderation_logs')
      .select('id, safe, violations, confidence, false_positive_reported, created_at')
      .eq('user_id', user_data.id)
      .eq('false_positive_reported', true)
      .order('created_at', { ascending: false })
    
    export_data.moderation_reports = moderation_logs || []

    // Get billing transactions
    const { data: billing_data } = await supabase
      .from('billing_transactions')
      .select('id, type, amount, tokens, description, created_at')
      .eq('user_id', user_data.id)
      .order('created_at', { ascending: false })
      .limit(100)
    
    export_data.billing_history = billing_data || []

    // Get workflow data if applicable
    const { data: workflows } = await supabase
      .from('workflows')
      .select('id, name, description, is_public, created_at, updated_at')
      .eq('user_id', user_data.id)
    
    export_data.workflows = workflows || []

    // Get chat sessions
    const { data: chat_sessions } = await supabase
      .from('workflow_sessions')
      .select('id, workflow_id, created_at, updated_at')
      .eq('user_id', user_data.id)
      .order('created_at', { ascending: false })
      .limit(50)
    
    export_data.chat_sessions = chat_sessions || []

    // Create filename with timestamp
    const filename = `studio-moikas-data-export-${user.id}-${Date.now()}.json`

    // Return as downloadable JSON file
    return new Response(JSON.stringify(export_data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Export-Date': new Date().toISOString()
      }
    })
  } catch (error) {
    return handle_api_error(error)
  }
}