-- Add the fal-ai/lora model that is referenced in the code
INSERT INTO models (
  model_id,
  name,
  type,
  cost_per_mp,
  custom_cost,
  supports_image_input,
  is_text_only,
  size_mode,
  supported_pixel_sizes,
  supported_aspect_ratios,
  supports_both_size_modes,
  supports_cfg,
  default_cfg,
  min_cfg,
  max_cfg,
  supports_steps,
  default_steps,
  max_steps,
  max_images,
  supports_loras,
  supports_embeddings,
  metadata,
  is_active,
  is_default,
  display_order
) VALUES (
  'fal-ai/lora',
  'Any LoRA Model',
  'image',
  0.002,
  0.002,
  false,
  false,
  'aspect_ratio',
  '[]'::jsonb,
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4'],
  true,
  false, -- LoRA models don't have standard cfg support
  NULL,
  NULL,
  NULL,
  false, -- LoRA models don't have standard steps support
  NULL,
  NULL,
  1,
  true, -- This IS a LoRA model
  true, -- Supports embeddings
  jsonb_build_object(
    'allow_custom_model_name', true,
    'default_model_name', 'stabilityai/stable-diffusion-xl-base-1.0',
    'supported_model_sources', ARRAY['HuggingFace', 'CivitAI', 'Custom URL'],
    'enable_dynamic_pricing', true,
    'cost_per_inference_second', 2, -- 2 MP per second of inference
    'description', 'Use any Stable Diffusion model from HuggingFace or CivitAI with dynamic pricing based on inference time'
  ),
  true,
  false,
  50
);

-- Add model metadata for pricing examples
UPDATE models 
SET metadata = metadata || jsonb_build_object(
  'pricing_examples', jsonb_build_array(
    jsonb_build_object('seconds', 1, 'cost_mp', 2),
    jsonb_build_object('seconds', 2.5, 'cost_mp', 5),
    jsonb_build_object('seconds', 5, 'cost_mp', 10)
  )
)
WHERE model_id = 'fal-ai/lora';