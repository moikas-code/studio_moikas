import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  get_service_role_client 
} from '@/lib/utils/database/supabase';
import { 
  check_admin_access 
} from '@/lib/utils/api/admin';
import {
  api_success,
  api_error,
  handle_api_error
} from '@/lib/utils/api/response';
import {
  validate_request
} from '@/lib/utils/api/validation';

// Validation schemas
const pixel_size_schema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  label: z.string().optional()
});

const model_update_schema = z.object({
  model_id: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(['image', 'video', 'audio', 'text']).optional(),
  cost_per_mp: z.number().positive().optional(),
  custom_cost: z.number().positive().optional(),
  supports_image_input: z.boolean().optional(),
  is_text_only: z.boolean().optional(),
  size_mode: z.enum(['pixel', 'aspect_ratio']).optional(),
  supported_pixel_sizes: z.array(pixel_size_schema).optional(),
  supported_aspect_ratios: z.array(z.string()).optional(),
  supports_both_size_modes: z.boolean().optional(),
  supports_cfg: z.boolean().optional(),
  default_cfg: z.number().min(0).nullable().optional(),
  max_cfg: z.number().min(0).nullable().optional(),
  supports_steps: z.boolean().optional(),
  default_steps: z.number().int().positive().nullable().optional(),
  max_steps: z.number().int().positive().nullable().optional(),
  max_images: z.number().int().positive().max(10).optional(),
  duration_options: z.array(z.number().int().positive()).optional(),
  supports_audio_generation: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  api_endpoint: z.string().nullable().optional(),
  api_version: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional()
});

// GET /api/admin/models/[id] - Get a specific model
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403);
    }
    
    const { id: model_id } = await params;
    if (!model_id) {
      return api_error('Model ID is required', 400);
    }
    
    const supabase = get_service_role_client();
    
    const { data, error } = await supabase
      .from('models')
      .select('*')
      .eq('id', model_id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return api_error('Model not found', 404);
      }
      throw error;
    }
    
    return api_success(data);
    
  } catch (error) {
    return handle_api_error(error);
  }
}

// PUT /api/admin/models/[id] - Update a specific model
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403);
    }
    
    const { id: model_id } = await params;
    if (!model_id) {
      return api_error('Model ID is required', 400);
    }
    
    // Parse and validate request body
    const body = await req.json();
    const validated = validate_request(model_update_schema, body);
    
    const supabase = get_service_role_client();
    
    // Check if model exists
    const { data: existing } = await supabase
      .from('models')
      .select('id')
      .eq('id', model_id)
      .single();
    
    if (!existing) {
      return api_error('Model not found', 404);
    }
    
    // Check if new model_id conflicts with another model
    if (validated.model_id) {
      const { data: conflict } = await supabase
        .from('models')
        .select('id')
        .eq('model_id', validated.model_id)
        .neq('id', model_id)
        .single();
      
      if (conflict) {
        return api_error('Model ID already exists', 400);
      }
    }
    
    // Update the model
    const { data, error } = await supabase
      .from('models')
      .update(validated)
      .eq('id', model_id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return api_success({
      model: data,
      success: true
    });
    
  } catch (error) {
    return handle_api_error(error);
  }
}

// DELETE /api/admin/models/[id] - Delete a specific model
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403);
    }
    
    const { id: model_id } = await params;
    if (!model_id) {
      return api_error('Model ID is required', 400);
    }
    
    const supabase = get_service_role_client();
    
    // Hard delete - actually remove the model
    const { error } = await supabase
      .from('models')
      .delete()
      .eq('id', model_id);
    
    if (error) {
      throw error;
    }
    
    return api_success({
      success: true
    });
    
  } catch (error) {
    return handle_api_error(error);
  }
}

// PATCH /api/admin/models/[id]/toggle - Toggle active status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error('Admin access required', 403);
    }
    
    const { id: model_id } = await params;
    if (!model_id) {
      return api_error('Model ID is required', 400);
    }
    
    const supabase = get_service_role_client();
    
    // Get current status
    const { data: current, error: fetch_error } = await supabase
      .from('models')
      .select('is_active')
      .eq('id', model_id)
      .single();
    
    if (fetch_error) {
      if (fetch_error.code === 'PGRST116') {
        return api_error('Model not found', 404);
      }
      throw fetch_error;
    }
    
    // Toggle the status
    const { data, error } = await supabase
      .from('models')
      .update({ is_active: !current.is_active })
      .eq('id', model_id)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return api_success({
      model: data,
      success: true
    });
    
  } catch (error) {
    return handle_api_error(error);
  }
}
