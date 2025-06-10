import { NextRequest } from 'next/server'
import { 
  get_service_role_client 
} from '@/lib/utils/database/supabase'
import {
  api_success,
  api_error,
  handle_api_error
} from '@/lib/utils/api/response'
import { check_admin_access } from '@/lib/utils/api/admin'
import { z } from 'zod'

const create_embedding_schema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  type: z.enum(['embedding', 'lora']),
  model_type: z.string().default('sdxl'),
  tokens: z.array(z.string()).default(['<s0>', '<s1>']),
  url: z.string().url(),
  is_public: z.boolean().default(false),
  is_default: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.any()).default({})
})

// GET /api/admin/embeddings - Get all embeddings (admin only)
export async function GET() {
  try {
    const admin_check = await check_admin_access()
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403)
    }
    
    const supabase = get_service_role_client()
    
    const { data: embeddings, error } = await supabase
      .from('embeddings')
      .select('*')
      .order('created_at', { ascending: false })

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

// POST /api/admin/embeddings - Create a new embedding (admin only)
export async function POST(req: NextRequest) {
  try {
    const admin_check = await check_admin_access()
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403)
    }
    
    const body = await req.json()
    const validated = create_embedding_schema.parse(body)

    const supabase = get_service_role_client()
    
    // Get admin's internal ID
    const { data: user_data } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', admin_check.user_id)
      .single()

    if (!user_data) {
      return api_error('User not found', 404)
    }

    // Create the embedding
    const { data, error } = await supabase
      .from('embeddings')
      .insert({
        ...validated,
        created_by: user_data.id
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