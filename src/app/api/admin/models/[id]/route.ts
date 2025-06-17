import { NextRequest } from "next/server";
import { z } from "zod";
import { get_service_role_client } from "@/lib/utils/database/supabase";
import { check_admin_access } from "@/lib/utils/api/admin";
import { api_success, api_error, handle_api_error } from "@/lib/utils/api/response";
import { validate_request } from "@/lib/utils/api/validation";

// Validation schemas
const pixel_size_schema = z.object({
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  label: z.string().optional(),
});

const model_update_schema = z.object({
  model_id: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(["image", "video", "audio", "text"]).optional(),
  variant_name: z.string().optional(),
  configuration_id: z.string().optional(),
  cost_per_mp: z.number().positive().optional(),
  custom_cost: z.number().positive().optional(),
  supports_image_input: z.boolean().optional(),
  is_text_only: z.boolean().optional(),
  size_mode: z.enum(["pixel", "aspect_ratio"]).optional(),
  supported_pixel_sizes: z.array(pixel_size_schema).optional(),
  supported_aspect_ratios: z.array(z.string()).optional(),
  supports_both_size_modes: z.boolean().optional(),
  supports_cfg: z.boolean().optional(),
  default_cfg: z.number().min(0).nullable().optional(),
  min_cfg: z.number().min(0).nullable().optional(),
  max_cfg: z.number().min(0).nullable().optional(),
  supports_steps: z.boolean().optional(),
  default_steps: z.number().int().positive().nullable().optional(),
  max_steps: z.number().int().positive().nullable().optional(),
  max_images: z.number().int().positive().max(10).optional(),
  duration_options: z.array(z.number().int().positive()).optional(),
  supports_audio_generation: z.boolean().optional(),

  // LoRA/SD specific
  supports_loras: z.boolean().optional(),
  supports_embeddings: z.boolean().optional(),
  supports_controlnet: z.boolean().optional(),
  supports_ip_adapter: z.boolean().optional(),
  supported_schedulers: z.array(z.string()).optional(),
  default_scheduler: z.string().nullable().optional(),
  supported_prediction_types: z.array(z.string()).optional(),
  default_prediction_type: z.string().nullable().optional(),
  supports_clip_skip: z.boolean().optional(),
  default_clip_skip: z.number().int().nullable().optional(),
  max_clip_skip: z.number().int().nullable().optional(),
  supports_eta: z.boolean().optional(),
  default_eta: z.number().nullable().optional(),
  max_eta: z.number().nullable().optional(),
  supports_prompt_weighting: z.boolean().optional(),
  supported_variants: z.array(z.string()).optional(),
  default_variant: z.string().nullable().optional(),
  has_safety_checker: z.boolean().optional(),
  supports_custom_sigmas: z.boolean().optional(),
  supports_custom_timesteps: z.boolean().optional(),
  supports_tile_size: z.boolean().optional(),
  default_tile_width: z.number().int().nullable().optional(),
  default_tile_height: z.number().int().nullable().optional(),
  max_tile_width: z.number().int().nullable().optional(),
  max_tile_height: z.number().int().nullable().optional(),

  // Billing configuration
  billing_type: z.enum(["flat_rate", "time_based"]).optional(),
  min_time_charge_seconds: z.number().nullable().optional(),
  max_time_charge_seconds: z.number().nullable().optional(),

  metadata: z.record(z.unknown()).optional(),
  api_endpoint: z.string().nullable().optional(),
  api_version: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  display_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
  is_default: z.boolean().optional(),
});

// GET /api/admin/models/[id] - Get a specific model
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error("Admin access required", 403);
    }

    const { id: model_id } = await params;
    if (!model_id) {
      return api_error("Model ID is required", 400);
    }

    const supabase = get_service_role_client();

    const { data, error } = await supabase.from("models").select("*").eq("id", model_id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return api_error("Model not found", 404);
      }
      throw error;
    }

    return api_success(data);
  } catch (error) {
    return handle_api_error(error);
  }
}

// PUT /api/admin/models/[id] - Update a specific model
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error("Admin access required", 403);
    }

    const { id: model_id } = await params;
    if (!model_id) {
      return api_error("Model ID is required", 400);
    }

    // Parse and validate request body
    const body = await req.json();
    const validated = validate_request(model_update_schema, body);

    const supabase = get_service_role_client();

    // Check if model exists
    const { data: existing } = await supabase
      .from("models")
      .select("id")
      .eq("id", model_id)
      .single();

    if (!existing) {
      return api_error("Model not found", 404);
    }

    // Note: We now allow duplicate model_id values to support multiple configurations
    // of the same AI model with different settings

    // Update the model
    const { data, error } = await supabase
      .from("models")
      .update(validated)
      .eq("id", model_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return api_success({
      model: data,
      success: true,
    });
  } catch (error) {
    return handle_api_error(error);
  }
}

// DELETE /api/admin/models/[id] - Delete a specific model
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error("Admin access required", 403);
    }

    const { id: model_id } = await params;
    if (!model_id) {
      return api_error("Model ID is required", 400);
    }

    const supabase = get_service_role_client();

    // First check if model exists
    const { data: model, error: check_error } = await supabase
      .from("models")
      .select("id, name")
      .eq("id", model_id)
      .single();

    if (check_error || !model) {
      return api_error("Model not found", 404);
    }

    // Use the database function to handle deletion with proper audit logging
    const { data: result, error } = await supabase.rpc("delete_model_with_audit", {
      p_model_id: model_id,
    });

    if (error) {
      // If the function doesn't exist yet, fall back to direct deletion
      if (error.code === "42883") {
        console.log("Function not found, using direct deletion");

        // Disable the trigger by deleting related audit logs first
        await supabase.from("model_audit_log").delete().eq("model_id", model_id);

        // Now delete the model
        const { error: delete_error } = await supabase.from("models").delete().eq("id", model_id);

        if (delete_error) {
          console.error("Delete error:", delete_error);
          throw delete_error;
        }
      } else {
        console.error("Delete error:", error);
        throw error;
      }
    } else if (result && !result.success) {
      throw new Error(result.error || "Failed to delete model");
    }

    return api_success({
      success: true,
      deleted_model: model.name,
    });
  } catch (error) {
    return handle_api_error(error);
  }
}

// PATCH /api/admin/models/[id]/toggle - Toggle active status
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Check admin access
    const admin_check = await check_admin_access();
    if (!admin_check.is_admin) {
      return api_error("Admin access required", 403);
    }

    const { id: model_id } = await params;
    if (!model_id) {
      return api_error("Model ID is required", 400);
    }

    const supabase = get_service_role_client();

    // Get current status
    const { data: current, error: fetch_error } = await supabase
      .from("models")
      .select("is_active")
      .eq("id", model_id)
      .single();

    if (fetch_error) {
      if (fetch_error.code === "PGRST116") {
        return api_error("Model not found", 404);
      }
      throw fetch_error;
    }

    // Toggle the status
    const { data, error } = await supabase
      .from("models")
      .update({ is_active: !current.is_active })
      .eq("id", model_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return api_success({
      model: data,
      success: true,
    });
  } catch (error) {
    return handle_api_error(error);
  }
}
