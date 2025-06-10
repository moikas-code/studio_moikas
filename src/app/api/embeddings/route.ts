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
// GET /api/embeddings - Get available embeddings
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return api_error('Unauthorized', 401)
    }

    const supabase = get_service_role_client()
    
    // Get user's internal ID
    const { data: user_data } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user_data) {
      return api_error('User not found', 404)
    }

    // Fetch embeddings - public ones and user's own
    const { data: embeddings, error } = await supabase
      .from('embeddings')
      .select('*')
      .or(`is_public.eq.true,created_by.eq.${user_data.id}`)
      .order('is_default', { ascending: false })
      .order('name')

    if (error) {
      throw error
    }

    return api_success({
      embeddings: embeddings || []
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}

// POST /api/embeddings - Create a new embedding
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return api_error('Unauthorized', 401)
    }

    const body = await req.json()
    const { name, description, type, model_type, tokens, url, tags, metadata } = body

    if (!name || !type || !model_type || !url) {
      return api_error('Missing required fields', 400)
    }

    const supabase = get_service_role_client()
    
    // Get user's internal ID
    const { data: user_data } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()

    if (!user_data) {
      return api_error('User not found', 404)
    }

    // Create the embedding
    const { data, error } = await supabase
      .from('embeddings')
      .insert({
        name,
        description,
        type,
        model_type,
        tokens: tokens || ['<s0>', '<s1>'],
        url,
        created_by: user_data.id,
        tags: tags || [],
        metadata: metadata || {},
        is_public: false // Start as private
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return api_success({
      embedding: data,
      success: true
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}