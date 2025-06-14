/**
 * Model Management System Types
 * 
 * Comprehensive type definitions for the flexible model configuration system
 */

export type ModelType = 'image' | 'video' | 'audio' | 'text';
export type SizeMode = 'pixel' | 'aspect_ratio';

export interface PixelSize {
  width: number;
  height: number;
  label?: string; // e.g., "1024x1024 (Square)"
}

export interface ModelConfig {
  id: string; // UUID
  model_id: string; // The unique identifier used in API calls
  name: string;
  type: ModelType;
  cost_per_mp: number;
  custom_cost: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Image/Video specific flags
  supports_image_input: boolean;
  is_text_only: boolean;
  
  // Size configuration
  size_mode: SizeMode;
  supported_pixel_sizes: PixelSize[];
  supported_aspect_ratios: string[];
  supports_both_size_modes?: boolean;
  
  // Generation parameters
  supports_cfg: boolean;
  default_cfg?: number;
  min_cfg?: number;
  max_cfg?: number;
  
  supports_steps: boolean;
  default_steps?: number;
  max_steps?: number;
  
  // Image specific
  max_images: number;
  
  // Video specific
  duration_options: number[]; // seconds
  supports_audio_generation: boolean;
  
  // LoRA/SD specific features
  supports_loras: boolean;
  supports_embeddings: boolean;
  supports_controlnet: boolean;
  supports_ip_adapter: boolean;
  
  // Scheduler configuration
  supported_schedulers: string[];
  default_scheduler?: string;
  
  // Advanced parameters
  supports_tile_size: boolean;
  default_tile_width?: number;
  default_tile_height?: number;
  max_tile_width?: number;
  max_tile_height?: number;
  
  // Prediction type
  supported_prediction_types: string[];
  default_prediction_type?: string;
  
  // Clip skip
  supports_clip_skip: boolean;
  default_clip_skip?: number;
  max_clip_skip?: number;
  
  // Eta parameter
  supports_eta: boolean;
  default_eta?: number;
  max_eta?: number;
  
  // Prompt features
  supports_prompt_weighting: boolean;
  
  // Model variants
  supported_variants: string[];
  default_variant?: string;
  
  // Safety
  has_safety_checker: boolean;
  
  // Custom sigmas/timesteps
  supports_custom_sigmas: boolean;
  supports_custom_timesteps: boolean;
  
  // Additional metadata
  metadata: Record<string, unknown>;
  
  // API configuration
  api_endpoint?: string;
  api_version?: string;
  
  // Display configuration
  display_order: number;
  tags: string[];
  
  // Default model flag
  is_default: boolean;
  
  // Billing configuration
  billing_type: BillingType;
  min_time_charge_seconds?: number;
  max_time_charge_seconds?: number;
}

export interface ModelPreset {
  id: string;
  model_id: string;
  name: string;
  description?: string;
  config: {
    cfg?: number;
    steps?: number;
    size?: PixelSize | string; // pixel size or aspect ratio
    duration?: number;
    generate_audio?: boolean;
    [key: string]: unknown;
  };
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ModelAuditLog {
  id: string;
  model_id: string;
  admin_id: string;
  action: 'create' | 'update' | 'delete' | 'activate' | 'deactivate';
  changes: {
    old?: Partial<ModelConfig>;
    new?: Partial<ModelConfig>;
    diff?: Record<string, unknown>;
  };
  created_at: string;
}

// LoRA configuration types
export interface LoraConfig {
  id: string;
  name: string;
  path: string;
  scale: number;
  description?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface EmbeddingConfig {
  id: string;
  name: string;
  path: string;
  tokens: string[];
  description?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ControlNetConfig {
  id: string;
  name: string;
  path: string;
  config_url?: string;
  variant?: string;
  type: string;
  description?: string;
  conditioning_scale: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// Form types for creating/updating models
export interface ModelFormData {
  model_id: string;
  name: string;
  type: ModelType;
  cost_per_mp: number;
  custom_cost: number;
  
  // Optional fields
  supports_image_input?: boolean;
  is_text_only?: boolean;
  size_mode?: SizeMode;
  supported_pixel_sizes?: PixelSize[];
  supported_aspect_ratios?: string[];
  supports_both_size_modes?: boolean;
  supports_cfg?: boolean;
  default_cfg?: number;
  min_cfg?: number;
  max_cfg?: number;
  supports_steps?: boolean;
  default_steps?: number;
  max_steps?: number;
  max_images?: number;
  duration_options?: number[];
  supports_audio_generation?: boolean;
  
  // LoRA/SD specific
  supports_loras?: boolean;
  supports_embeddings?: boolean;
  supports_controlnet?: boolean;
  supports_ip_adapter?: boolean;
  supported_schedulers?: string[];
  default_scheduler?: string;
  supports_tile_size?: boolean;
  default_tile_width?: number;
  default_tile_height?: number;
  max_tile_width?: number;
  max_tile_height?: number;
  supported_prediction_types?: string[];
  default_prediction_type?: string;
  supports_clip_skip?: boolean;
  default_clip_skip?: number;
  max_clip_skip?: number;
  supports_eta?: boolean;
  default_eta?: number;
  max_eta?: number;
  supports_prompt_weighting?: boolean;
  supported_variants?: string[];
  default_variant?: string;
  has_safety_checker?: boolean;
  supports_custom_sigmas?: boolean;
  supports_custom_timesteps?: boolean;
  
  metadata?: Record<string, unknown>;
  api_endpoint?: string;
  api_version?: string;
  tags?: string[];
  display_order?: number;
  is_default?: boolean;
  
  // Billing configuration
  billing_type?: BillingType;
  min_time_charge_seconds?: number;
  max_time_charge_seconds?: number;
}

// Helper type for model parameters based on type
export interface ModelParameters {
  // Common parameters
  prompt: string;
  negative_prompt?: string;
  
  // Size parameters
  width?: number;
  height?: number;
  aspect_ratio?: string;
  
  // Generation parameters
  cfg?: number;
  steps?: number;
  seed?: number;
  
  // Image specific
  num_images?: number;
  image_url?: string; // for image-to-image
  
  // Video specific
  duration?: number;
  generate_audio?: boolean;
  
  // Style and quality
  style?: string;
  quality?: string;
  
  // LoRA/SD specific parameters
  scheduler?: string;
  loras?: Array<{ path: string; scale: number }>;
  embeddings?: Array<{ path: string; tokens: string[] }>;
  controlnets?: Array<{
    path: string;
    image_url: string;
    conditioning_scale?: number;
    start_percentage?: number;
    end_percentage?: number;
  }>;
  ip_adapter?: {
    image_url: string | string[];
    path: string;
    scale?: number;
  };
  clip_skip?: number;
  eta?: number;
  prediction_type?: string;
  variant?: string;
  enable_safety_checker?: boolean;
  prompt_weighting?: boolean;
  tile_width?: number;
  tile_height?: number;
  tile_stride_width?: number;
  tile_stride_height?: number;
  
  // Additional parameters from metadata
  [key: string]: unknown;
}

// Response types
export interface ModelListResponse {
  models: ModelConfig[];
  total: number;
  page: number;
  limit: number;
}

export interface ModelCreateResponse {
  model: ModelConfig;
  success: boolean;
  error?: string;
}

export interface ModelUpdateResponse {
  model: ModelConfig;
  success: boolean;
  error?: string;
}

export interface ModelDeleteResponse {
  success: boolean;
  error?: string;
}

// Filter and search types
export interface ModelFilters {
  type?: ModelType;
  is_active?: boolean;
  tags?: string[];
  supports_image_input?: boolean;
  search?: string;
}

// Validation helpers
export const MODEL_TYPE_OPTIONS: { value: ModelType; label: string }[] = [
  { value: 'image', label: 'Image Generation' },
  { value: 'video', label: 'Video Generation' },
  { value: 'audio', label: 'Audio Generation' },
  { value: 'text', label: 'Text Generation' }
];

export const SIZE_MODE_OPTIONS: { value: SizeMode; label: string }[] = [
  { value: 'aspect_ratio', label: 'Aspect Ratio' },
  { value: 'pixel', label: 'Pixel Size' }
];

export const BILLING_TYPE_OPTIONS: { value: BillingType; label: string; description: string }[] = [
  { 
    value: 'flat_rate', 
    label: 'Flat Rate', 
    description: 'Fixed cost per generation regardless of processing time' 
  },
  { 
    value: 'time_based', 
    label: 'Time-Based', 
    description: 'Cost = Base MP × Processing seconds (e.g., 1 MP base × 3 seconds = 3 MP)' 
  }
];

export const DEFAULT_ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '3:2',
  '2:3',
  '21:9',
  '9:21'
];

export const DEFAULT_PIXEL_SIZES: PixelSize[] = [
  { width: 512, height: 512, label: '512x512 (SD)' },
  { width: 768, height: 768, label: '768x768' },
  { width: 1024, height: 1024, label: '1024x1024 (Square)' },
  { width: 1280, height: 720, label: '1280x720 (HD)' },
  { width: 1920, height: 1080, label: '1920x1080 (Full HD)' },
  { width: 2048, height: 2048, label: '2048x2048' }
];

export const DEFAULT_DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// LoRA/SD specific constants
export const SCHEDULER_OPTIONS = [
  'DPM++ 2M',
  'DPM++ 2M Karras',
  'DPM++ 2M SDE',
  'DPM++ 2M SDE Karras',
  'Euler',
  'Euler A',
  'Euler (trailing timesteps)',
  'LCM',
  'LCM (trailing timesteps)',
  'DDIM',
  'TCD'
];

export const PREDICTION_TYPE_OPTIONS = [
  'epsilon',
  'v_prediction'
];

export const CONTROLNET_TYPES = [
  'canny',
  'depth',
  'pose',
  'mlsd',
  'normal',
  'openpose',
  'scribble',
  'seg',
  'shuffle',
  'softedge',
  'tile'
];

// Utility functions
export function get_model_cost_in_mp(model: ModelConfig): number {
  return model.custom_cost / 0.001; // Convert dollar cost to MP
}

export function format_model_type(type: ModelType): string {
  return MODEL_TYPE_OPTIONS.find(opt => opt.value === type)?.label || type;
}

export function validate_model_parameters(
  model: ModelConfig,
  params: ModelParameters
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate size parameters
  if (model.size_mode === 'pixel' && params.width && params.height) {
    const size_exists = model.supported_pixel_sizes.some(
      size => size.width === params.width && size.height === params.height
    );
    if (!size_exists) {
      errors.push(`Unsupported pixel size: ${params.width}x${params.height}`);
    }
  } else if (model.size_mode === 'aspect_ratio' && params.aspect_ratio) {
    if (!model.supported_aspect_ratios.includes(params.aspect_ratio)) {
      errors.push(`Unsupported aspect ratio: ${params.aspect_ratio}`);
    }
  }
  
  // Validate CFG
  if (params.cfg !== undefined && model.supports_cfg) {
    if (model.max_cfg && params.cfg > model.max_cfg) {
      errors.push(`CFG value ${params.cfg} exceeds maximum of ${model.max_cfg}`);
    }
  }
  
  // Validate steps
  if (params.steps !== undefined && model.supports_steps) {
    if (model.max_steps && params.steps > model.max_steps) {
      errors.push(`Steps value ${params.steps} exceeds maximum of ${model.max_steps}`);
    }
  }
  
  // Validate duration for video
  if (model.type === 'video' && params.duration) {
    if (!model.duration_options.includes(params.duration)) {
      errors.push(`Unsupported duration: ${params.duration} seconds`);
    }
  }
  
  // Validate image input requirement
  if (params.image_url && !model.supports_image_input) {
    errors.push('This model does not support image input');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}