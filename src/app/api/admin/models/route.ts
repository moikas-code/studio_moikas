import { NextRequest } from 'next/server';
import { z } from 'zod';
import { 
  get_service_role_client 
} from '@/lib/utils/database/supabase';
import { 
  require_admin_access 
} from '@/lib/utils/api/admin';
import {
  api_success,
  api_error,
  handle_api_error
} from '@/lib/utils/api/response';
import {
  validate_request
} from '@/lib/utils/api/validation';
import type { 
  ModelFilters
} from '@/types/models';

// Validation schemas
const pixel_size_schema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  label: z.string().optional()
});

const model_create_schema = z.object({
  model_id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['image', 'video', 'audio', 'text']),
  cost_per_mp: z.number().positive(),
  custom_cost: z.number().positive(),
  
  // Optional fields
  supports_image_input: z.boolean().optional(),
  is_text_only: z.boolean().optional(),
  size_mode: z.enum(['pixel', 'aspect_ratio']).optional(),
  supported_pixel_sizes: z.array(pixel_size_schema).optional(),
  supported_aspect_ratios: z.array(z.string()).optional(),
  supports_both_size_modes: z.boolean().optional(),
  supports_cfg: z.boolean().optional(),
  default_cfg: z.number().min(0).optional(),
  max_cfg: z.number().min(0).optional(),
  supports_steps: z.boolean().optional(),
  default_steps: z.number().int().positive().optional(),
  max_steps: z.number().int().positive().optional(),
  max_images: z.number().int().positive().max(10).optional(),
  duration_options: z.array(z.number().int().positive()).optional(),
  supports_audio_generation: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
  api_endpoint: z.string().optional(),
  api_version: z.string().optional(),
  tags: z.array(z.string()).optional(),
  display_order: z.number().int().optional(),
  is_default: z.boolean().optional()
});

const model_update_schema = model_create_schema.partial();

const model_filters_schema = z.object({
  type: z.enum(['image', 'video', 'audio', 'text']).optional(),
  is_active: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  supports_image_input: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

// GET /api/admin/models - List models with filters
export async function GET(req: NextRequest) {
  try {
    // Check admin access
    const admin_error = await require_admin_access();
    if (admin_error) return admin_error;
    
    // Parse query parameters
    const search_params = req.nextUrl.searchParams;
    const type_param = search_params.get('type');
    const filters: ModelFilters = {
      type: type_param ? type_param as 'image' | 'video' | 'audio' | 'text' : undefined,
      is_active: search_params.get('is_active') === 'true' ? true : 
                 search_params.get('is_active') === 'false' ? false : undefined,
      tags: search_params.getAll('tags').filter(Boolean),
      supports_image_input: search_params.get('supports_image_input') === 'true' ? true :
                           search_params.get('supports_image_input') === 'false' ? false : undefined,
      search: search_params.get('search') || undefined
    };
    
    const parsed_page = parseInt(search_params.get('page') || '1');
    const parsed_limit = parseInt(search_params.get('limit') || '20');
    
    // Validate filters
    const validated = validate_request(model_filters_schema, {
      ...filters,
      page: parsed_page,
      limit: parsed_limit
    });
    
    const supabase = get_service_role_client();
    
    // Build query
    let query = supabase
      .from('models')
      .select('*', { count: 'exact' });
    
    // Apply filters
    if (validated.type) {
      query = query.eq('type', validated.type);
    }
    if (validated.is_active !== undefined) {
      query = query.eq('is_active', validated.is_active);
    }
    if (validated.tags && validated.tags.length > 0) {
      query = query.contains('tags', validated.tags);
    }
    if (validated.supports_image_input !== undefined) {
      query = query.eq('supports_image_input', validated.supports_image_input);
    }
    if (validated.search) {
      query = query.or(`name.ilike.%${validated.search}%,model_id.ilike.%${validated.search}%`);
    }
    
    // Apply pagination
    const page = validated.page ?? 1;
    const limit = validated.limit ?? 20;
    const offset = (page - 1) * limit;
    query = query
      .order('display_order', { ascending: true })
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    
    if (error) {
      throw error;
    }
    
    return api_success({
      models: data || [],
      total: count || 0,
      page,
      limit
    });
    
  } catch (error) {
    return handle_api_error(error);
  }
}

// POST /api/admin/models - Create a new model
export async function POST(req: NextRequest) {
  try {
    // Check admin access
    const admin_error = await require_admin_access();
    if (admin_error) return admin_error;
    
    // Parse and validate request body
    const body = await req.json();
    const validated = validate_request(model_create_schema, body);
    
    const supabase = get_service_role_client();
    
    // Check if model_id already exists
    const { data: existing } = await supabase
      .from('models')
      .select('id')
      .eq('model_id', validated.model_id)
      .single();
    
    if (existing) {
      return api_error('Model ID already exists', 400);
    }
    
    // Create the model
    const { data, error } = await supabase
      .from('models')
      .insert({
        ...validated,
        is_active: true
      })
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

// PUT /api/admin/models/[id] - Update a model
export async function PUT(req: NextRequest) {
  try {
    // Check admin access
    const admin_error = await require_admin_access();
    if (admin_error) return admin_error;
    
    // Extract model ID from URL
    const url_parts = req.url.split('/');
    const model_id = url_parts[url_parts.length - 1];
    
    if (!model_id || model_id === 'models') {
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

// DELETE /api/admin/models/[id] - Delete a model
export async function DELETE(req: NextRequest) {
  try {
    // Check admin access
    const admin_error = await require_admin_access();
    if (admin_error) return admin_error;
    
    // Extract model ID from URL
    const url_parts = req.url.split('/');
    const model_id = url_parts[url_parts.length - 1];
    
    if (!model_id || model_id === 'models') {
      return api_error('Model ID is required', 400);
    }
    
    const supabase = get_service_role_client();
    
    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('models')
      .update({ is_active: false })
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