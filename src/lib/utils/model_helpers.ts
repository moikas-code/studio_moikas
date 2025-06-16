import { get_service_role_client } from "./database/supabase";
import type { ModelConfig, ModelParameters } from "@/types/models";

/**
 * Fetch active models from the database
 */
export async function fetch_active_models(
  type?: "image" | "video" | "audio" | "text"
): Promise<ModelConfig[]> {
  const supabase = get_service_role_client();

  let query = supabase
    .from("models")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true });

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch models:", error);
    return [];
  }

  return data || [];
}

/**
 * Fetch the default model for a specific type
 */
export async function fetch_default_model(
  type: "image" | "video" | "audio" | "text"
): Promise<ModelConfig | null> {
  const supabase = get_service_role_client();

  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("type", type)
    .eq("is_active", true)
    .eq("is_default", true)
    .single();

  if (error) {
    console.error("Failed to fetch default model:", error);
    return null;
  }

  return data;
}

/**
 * Fetch a specific model by model_id (returns first active match)
 * Note: Since model_id is no longer unique, this returns the first active model found
 * For specific model configurations, use the database id instead
 */
export async function fetch_model_by_id(model_id: string): Promise<ModelConfig | null> {
  const supabase = get_service_role_client();

  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("model_id", model_id)
    .eq("is_active", true)
    .order("is_default", { ascending: false }) // Prefer default models
    .order("created_at", { ascending: true }) // Then prefer older models (original configs)
    .limit(1);

  if (error) {
    console.error("Failed to fetch model:", error);
    return null;
  }

  return data?.[0] || null;
}

/**
 * Fetch a specific model configuration by database ID
 */
export async function fetch_model_by_database_id(id: string): Promise<ModelConfig | null> {
  const supabase = get_service_role_client();

  const { data, error } = await supabase.from("models").select("*").eq("id", id).single();

  if (error) {
    console.error("Failed to fetch model by ID:", error);
    return null;
  }

  return data;
}

/**
 * Fetch all active models with a specific model_id
 */
export async function fetch_models_by_model_id(model_id: string): Promise<ModelConfig[]> {
  const supabase = get_service_role_client();

  const { data, error } = await supabase
    .from("models")
    .select("*")
    .eq("model_id", model_id)
    .eq("is_active", true)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to fetch models by model_id:", error);
    return [];
  }

  return data || [];
}

/**
 * Get model cost in MP (Mana Points)
 */
export function calculate_model_cost_mp(model: ModelConfig, duration?: number): number {
  const base_mp_cost = model.custom_cost / 0.001; // Convert dollar cost to MP

  // For video models, multiply by duration
  if (model.type === "video" && duration) {
    return Math.ceil(base_mp_cost * duration);
  }

  return Math.ceil(base_mp_cost);
}

/**
 * Get available models for a user based on their plan
 * Admin users get all models at 0 cost
 */
export async function get_user_available_models(
  type: "image" | "video" | "audio" | "text",
  user_plan: string
): Promise<
  Array<{
    id: string;
    model_id: string;
    name: string;
    cost: number;
    config: ModelConfig;
  }>
> {
  const models = await fetch_active_models(type);

  return models.map((model) => ({
    id: model.model_id,
    model_id: model.model_id,
    name: model.name,
    cost: user_plan === "admin" ? 0 : calculate_model_cost_mp(model),
    config: model,
  }));
}

/**
 * Validate model parameters
 */
export function validate_model_params(
  model: ModelConfig,
  params: ModelParameters
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate size parameters
  if (model.size_mode === "pixel") {
    if (!params.width || !params.height) {
      errors.push("Width and height are required for pixel size mode");
    } else {
      const size_exists = model.supported_pixel_sizes.some(
        (size) => size.width === params.width && size.height === params.height
      );
      if (!size_exists) {
        errors.push(`Unsupported pixel size: ${params.width}x${params.height}`);
      }
    }
  } else if (model.size_mode === "aspect_ratio") {
    if (!params.aspect_ratio) {
      errors.push("Aspect ratio is required");
    } else if (!model.supported_aspect_ratios.includes(params.aspect_ratio)) {
      errors.push(`Unsupported aspect ratio: ${params.aspect_ratio}`);
    }
  }

  // Validate CFG
  if (params.cfg !== undefined && model.supports_cfg) {
    if (model.max_cfg && params.cfg > model.max_cfg) {
      errors.push(`CFG value ${params.cfg} exceeds maximum of ${model.max_cfg}`);
    }
    if (params.cfg < 0) {
      errors.push("CFG value must be positive");
    }
  }

  // Validate steps
  if (params.steps !== undefined && model.supports_steps) {
    if (model.max_steps && params.steps > model.max_steps) {
      errors.push(`Steps value ${params.steps} exceeds maximum of ${model.max_steps}`);
    }
    if (params.steps < 1) {
      errors.push("Steps value must be at least 1");
    }
  }

  // Validate image count
  if (params.num_images !== undefined && model.type === "image") {
    if (params.num_images > model.max_images) {
      errors.push(`Number of images ${params.num_images} exceeds maximum of ${model.max_images}`);
    }
    if (params.num_images < 1) {
      errors.push("Number of images must be at least 1");
    }
  }

  // Validate duration for video
  if (model.type === "video" && params.duration) {
    if (!model.duration_options.includes(params.duration)) {
      errors.push(`Unsupported duration: ${params.duration} seconds`);
    }
  }

  // Validate image input requirement
  if (params.image_url && !model.supports_image_input) {
    errors.push("This model does not support image input");
  }

  // Validate text-only models
  if (model.is_text_only && params.image_url) {
    errors.push("This model only supports text input");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get default parameters for a model
 */
export function get_model_defaults(model: ModelConfig): Partial<ModelParameters> {
  const defaults: Partial<ModelParameters> = {};

  // Size defaults
  if (model.size_mode === "aspect_ratio") {
    defaults.aspect_ratio = model.supported_aspect_ratios[0] || "1:1";
  } else if (model.size_mode === "pixel" && model.supported_pixel_sizes.length > 0) {
    defaults.width = model.supported_pixel_sizes[0].width;
    defaults.height = model.supported_pixel_sizes[0].height;
  }

  // Generation parameter defaults
  if (model.supports_cfg && model.default_cfg) {
    defaults.cfg = model.default_cfg;
  }

  if (model.supports_steps && model.default_steps) {
    defaults.steps = model.default_steps;
  }

  // Video defaults
  if (model.type === "video" && model.duration_options.length > 0) {
    defaults.duration = model.duration_options[0];
  }

  // Image defaults
  if (model.type === "image") {
    defaults.num_images = 1;
  }

  return defaults;
}

/**
 * Transform aspect ratio to dimensions
 */
export function aspect_ratio_to_dimensions(
  aspect_ratio: string,
  base_size: number = 1024
): { width: number; height: number } {
  const [width_ratio, height_ratio] = aspect_ratio.split(":").map(Number);

  if (!width_ratio || !height_ratio) {
    return { width: base_size, height: base_size };
  }

  const ratio = width_ratio / height_ratio;

  // Calculate dimensions maintaining the aspect ratio
  if (ratio >= 1) {
    // Landscape or square
    const width = base_size;
    const height = Math.round(base_size / ratio);
    return { width, height };
  } else {
    // Portrait
    const height = base_size;
    const width = Math.round(base_size * ratio);
    return { width, height };
  }
}
