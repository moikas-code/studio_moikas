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

const update_embedding_schema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  type: z.enum(['embedding', 'lora']).optional(),
  model_type: z.string().optional(),
  tokens: z.array(z.string()).optional(),
  url: z.string().url().optional(),
  is_public: z.boolean().optional(),
  is_default: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

// GET /api/admin/embeddings/[id] - Get a specific embedding
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin_check = await check_admin_access()
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403)
    }
    
    const { id } = await params
    const supabase = get_service_role_client()
    
    const { data, error } = await supabase
      .from('embeddings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return api_error('Embedding not found', 404)
      }
      throw error
    }

    return api_success({
      embedding: data
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}

// PUT /api/admin/embeddings/[id] - Update an embedding
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin_check = await check_admin_access()
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403)
    }
    
    const { id } = await params
    const body = await req.json()
    const validated = update_embedding_schema.parse(body)

    const supabase = get_service_role_client()
    
    const { data, error } = await supabase
      .from('embeddings')
      .update({
        ...validated,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return api_error('Embedding not found', 404)
      }
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

// PATCH /api/admin/embeddings/[id] - Partial update
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin_check = await check_admin_access()
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403)
    }
    
    const { id } = await params
    const body = await req.json()
    const supabase = get_service_role_client()
    
    const { data, error } = await supabase
      .from('embeddings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return api_error('Embedding not found', 404)
      }
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

// DELETE /api/admin/embeddings/[id] - Delete an embedding
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin_check = await check_admin_access()
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403)
    }
    
    const { id } = await params
    const supabase = get_service_role_client()
    
    const { error } = await supabase
      .from('embeddings')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return api_error('Embedding not found', 404)
      }
      throw error
    }

    return api_success({
      success: true
    })
    
  } catch (error) {
    return handle_api_error(error)
  }
}