/**
 * AI Models Configuration
 * 
 * Centralized configuration for all AI models used in the application.
 * This file makes it easier to update model configurations, pricing, and availability.
 */

/**
 * Image generation model configuration interface
 */
export interface image_model_config {
  value: string;
  name: string;
  mana_points: number;
  cost_per_mp: number;
  custom_cost: number;
  is_image_to_image: boolean;
  is_size_configurable: boolean;
  aspect_ratio: string[];
  max_cfgs: number;
  max_steps: number;
  max_images: number;
  plans: string[];
}

/**
 * Video generation model configuration interface
 */
export interface video_model_config {
  value: string;
  name: string;
  mana_points: number;
  cost_per_mp: number;
  custom_cost: number;
  is_image_to_video: boolean;
  plans?: string[];
}

/**
 * Free tier image generation models
 */
export const FREE_IMAGE_MODELS: image_model_config[] = [
  {
    value: "fal-ai/sana",
    name: "SANA Base",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.001,
    is_image_to_image: false,
    is_size_configurable: true,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/sana/sprint",
    name: "SANA Fast",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.0025,
    is_image_to_image: false,
    is_size_configurable: true,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/flux/schnell",
    name: "FLUX.1 [schnell]",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.003,
    is_image_to_image: false,
    is_size_configurable: true,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 0,
    max_steps: 0,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/luma-photon/flash",
    name: "Luma Photon Flash",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.005,
    is_image_to_image: false,
    is_size_configurable: true,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 0,
    max_steps: 0,
    max_images: 4,
    plans: ["free", "standard"],
  },
];

/**
 * Premium image generation models
 */
export const PREMIUM_IMAGE_MODELS: image_model_config[] = [
  {
    value: "fal-ai/recraft/v3/text-to-image",
    name: "Recraft v3",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.04,
    is_image_to_image: false,
    is_size_configurable: false,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/flux/dev",
    name: "FLUX.1 [dev]",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.025,
    is_image_to_image: false,
    is_size_configurable: false,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/flux-pro/v1.1-ultra",
    name: "FLUX.1.1 Ultra",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.06,
    is_image_to_image: false,
    is_size_configurable: false,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/imagen4/preview",
    name: "Imagen 4 [preview]",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.05,
    is_image_to_image: false,
    is_size_configurable: false,
    aspect_ratio: ["1:1", "16:9", "9:16", "2:3", "3:2", "3:4", "4:3", "21:9", "9:21"],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/flux-pro/kontext/text-to-image",
    name: "FLUX.1.1 Pro Kontext",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.04,
    is_image_to_image: false,
    is_size_configurable: false,
    aspect_ratio: [
      "1:1",
      "16:9",
      "9:16",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "21:9",
      "9:21",
    ],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/flux-pro/kontext/max/text-to-image",
    name: "FLUX.1.1 Pro Kontext Max",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.08,
    is_image_to_image: false,
    is_size_configurable: false,
    aspect_ratio: [
      "1:1",
      "16:9",
      "9:16",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "21:9",
      "9:21",
    ],
    max_cfgs: 20,
    max_steps: 50,
    max_images: 4,
    plans: ["free", "standard"],
  },
];

/**
 * Video generation models
 */
export const VIDEO_MODELS: video_model_config[] = [
  {
    value: "fal-ai/veo2",
    name: "VEO2",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.5,
    is_image_to_video: false,
  },
  {
    value: "fal-ai/veo2/pro",
    name: "VEO2 Pro",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.9,
    is_image_to_video: false,
  },
  {
    value: "fal-ai/kling-video/v1.6/standard/text-to-video",
    name: "Kling Video v1.6",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.045,
    is_image_to_video: false,
  },
  {
    value: "fal-ai/kling-video/v1.6/pro/text-to-video",
    name: "Kling Video v1.6 Pro",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.09,
    is_image_to_video: false,
  },
  {
    value: "fal-ai/kling-video/v2.1/standard/image-to-video",
    name: "Kling Video v2.1 [image]",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.05,
    is_image_to_video: true,
  },
  {
    value: "fal-ai/kling-video/v2.1/pro/image-to-video",
    name: "Kling Video v2.1 Pro [image]",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.09,
    is_image_to_video: true,
  },
  {
    value: "fal-ai/kling-video/v2.1/master/text-to-video",
    name: "Kling Video v2.1 Premium",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.28,
    is_image_to_video: false,
    plans: ["free", "standard"],
  },
  {
    value: "fal-ai/kling-video/v2.1/master/image-to-video",
    name: "Kling Video v2.1 Premium [image]",
    mana_points: 1,
    cost_per_mp: 0.001,
    custom_cost: 0.28,
    is_image_to_video: true,
    plans: ["free", "standard"],
  },
];

/**
 * Chat/LLM models configuration
 */
export const CHAT_MODELS = {
  "grok-3-mini-latest": {
    name: "Grok 3 Mini",
    provider: "xai",
    cost_per_1k_tokens: 0.0001,
    context_window: 128000,
    supports_streaming: true,
  },
  "grok-2-vision-1212": {
    name: "Grok 2 Vision",
    provider: "xai", 
    cost_per_1k_tokens: 0.002,
    context_window: 32000,
    supports_streaming: true,
    supports_vision: true,
  },
  "grok-2-1212": {
    name: "Grok 2",
    provider: "xai",
    cost_per_1k_tokens: 0.002,
    context_window: 128000,
    supports_streaming: true,
  },
} as const;

/**
 * Default model preferences
 */
export const DEFAULT_MODELS = {
  chat: "grok-3-mini-latest",
  image: "fal-ai/sana",
  video: "fal-ai/kling-video/v1.6/standard/text-to-video",
} as const;

// =============================================================================
// COMPUTED VALUES AND EXPORTS
// =============================================================================

/**
 * All image generation models (free + premium)
 */
export const ALL_IMAGE_MODELS: image_model_config[] = [
  ...FREE_IMAGE_MODELS,
  ...PREMIUM_IMAGE_MODELS,
];

/**
 * Legacy IMAGE_MODEL_COSTS mapping for backward compatibility
 */
export const IMAGE_MODEL_COSTS: Record<string, number> = {
  "fal-ai/recraft-v3": 6,
  "fal-ai/flux-lora": 6,
  "fal-ai/flux/schnell": 4,
  "fal-ai/flux-realism": 6,
  "fal-ai/flux-pro": 12,
  "fal-ai/flux/dev": 10,
  "fal-ai/stable-diffusion-v3-medium": 3,
  "fal-ai/aura-flow": 3,
  "fal-ai/kolors": 3,
  "fal-ai/stable-cascade": 5,
};

/**
 * Export free model IDs for use elsewhere
 */
export const FREE_MODEL_IDS = FREE_IMAGE_MODELS.map((m) => m.value);

/**
 * Export standard model IDs for use elsewhere
 */
export const STANDARD_MODEL_IDS = ALL_IMAGE_MODELS.filter((m) =>
  m.plans.includes("standard")
).map((m) => m.value);

/**
 * Export all chat model IDs
 */
export const CHAT_MODEL_IDS = Object.keys(CHAT_MODELS);

/**
 * Export all video model IDs
 */
export const VIDEO_MODEL_IDS = VIDEO_MODELS.map((m) => m.value);

/**
 * Helper function to get model configuration by ID
 */
export function get_image_model_config(model_id: string): image_model_config | undefined {
  return ALL_IMAGE_MODELS.find((m) => m.value === model_id);
}

/**
 * Helper function to get video model configuration by ID
 */
export function get_video_model_config(model_id: string): video_model_config | undefined {
  return VIDEO_MODELS.find((m) => m.value === model_id);
}

/**
 * Helper function to get chat model configuration by ID
 */
export function get_chat_model_config(model_id: string) {
  return CHAT_MODELS[model_id as keyof typeof CHAT_MODELS];
}

/**
 * Check if a model is available for a specific plan
 */
export function is_model_available_for_plan(model_id: string, plan: string): boolean {
  const model = get_image_model_config(model_id);
  if (!model) return false;
  return model.plans.includes(plan);
}