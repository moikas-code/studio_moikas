import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { 
  get_service_role_client 
} from '@/lib/utils/database/supabase'
import {
  api_success,
  api_error,
  handle_api_error
} from '@/lib/utils/api/response'
import type { ModelConfig } from '@/types/models'

// GET /api/models - Get available models for the current user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return api_error('Unauthorized', 401)
    }

    const supabase = get_service_role_client()
    
    // Get user's subscription to determine their plan
    const { data: user_data } = await supabase
      .from('users')
      .select('id, subscriptions(plan)')
      .eq('clerk_id', userId)
      .single()

    if (!user_data) {
      return api_error('User not found', 404)
    }

    const user_plan = user_data.subscriptions?.[0]?.plan || 'free'
    
    // Parse query parameters for filtering
    const search_params = req.nextUrl.searchParams
    const model_type = search_params.get('type') // 'image', 'video', 'audio', 'text'
    
    // Build query for active models
    let query = supabase
      .from('models')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
    
    // Filter by type if specified
    if (model_type) {
      query = query.eq('type', model_type)
    }
    
    const { data: models, error } = await query
    
    if (error) {
      throw error
    }
    
    // Filter models based on user plan
    // Admin users get all models
    // Other users get models based on their plan restrictions
    let available_models: ModelConfig[] = models || []
    
    if (user_plan !== 'admin') {
      // Here you can implement plan-based filtering
      // For now, we'll return all active models
      // You might want to add a 'required_plan' field to models table
      available_models = models || []
    }
    
    // Calculate effective cost for each model based on user plan
    const models_with_cost = available_models.map(model => ({
      ...model,
      effective_cost_mp: user_plan === 'admin' ? 0 : Math.round(model.custom_cost / 0.001)
    }))
    
    return api_success({
      models: models_with_cost,
      user_plan
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}