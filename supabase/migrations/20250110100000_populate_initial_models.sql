-- Populate initial models from the existing configuration

-- Image Models
INSERT INTO models (
  model_id, name, type, cost_per_mp, custom_cost,
  supports_image_input, is_text_only, size_mode,
  supported_aspect_ratios, supports_cfg, supports_steps,
  max_images, display_order, tags, is_default
) VALUES
-- SANA Models
('fal-ai/sana', 'SANA Base', 'image', 0.001, 0.001,
  false, true, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
  true, true, 1, 10, ARRAY['fast', 'basic'], false
),
-- FLUX Models
('fal-ai/flux-1/dev', 'FLUX Dev', 'image', 0.025, 0.025,
  false, true, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
  true, true, 4, 40, ARRAY['quality', 'detailed'], false
),
('fal-ai/flux-pro/kontext/text-to-image', 'FLUX Kontext Pro', 'image', 0.04, 0.04,
  false, true, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
  true, true, 4, 60, ARRAY['professional', 'latest'], false
),
('fal-ai/flux-pro/kontext/max/text-to-image', 'FLUX Kontext Max', 'image', 0.08, 0.08,
  false, true, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
  true, true, 4, 70, ARRAY['ultra', 'high-quality'], false
),
('fal-ai/flux-1/schnell', 'FLUX Schnell', 'image', 0.003, 0.003,
  false, true, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
  false, false, 4, 80, ARRAY['fast', 'efficient'], false
),
-- Stable Diffusion
('fal-ai/fast-sdxl', 'Fast SDXL', 'image', 0.002, 0.002,
  false, true, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16', '4:3', '3:4', '21:9', '9:21'],
  true, true, 1, 100, ARRAY['fast', 'sdxl'], true
);

-- Update metadata for SANA models with their specific configurations
UPDATE models SET 
  default_cfg = 7.5,
  max_cfg = 20,
  default_steps = 20,
  max_steps = 50,
  metadata = jsonb_build_object(
    'supports_styles', true,
    'style_presets', ARRAY[
      '(No style)',
      'Cinematic',
      'Photographic', 
      'Anime',
      'Manga',
      'Digital Art',
      'Pixel art',
      'Fantasy art',
      'Neonpunk',
      'Hyperrealism',
      '3D',
      'Watercolor',
      'Oil painting',
      'Sketch',
      'Comic',
      'Pop art',
      'Impressionism',
      'Minimalism',
      'Abstract',
      'Logo',
      'Icon',
      'Sticker',
      'Poster',
      'Typography',
      'Graffiti',
      'Collage',
      'Mosaic',
      'Psychedelic',
      'Retro',
      'Vintage',
      'Gothic',
      'Steampunk',
      'Cyberpunk',
      'Vaporwave',
      'Memphis',
      'Bauhaus',
      'Art Nouveau',
      'Art Deco'
    ]
  )
WHERE model_id LIKE 'fal-ai/sana%';

-- Update metadata for FLUX models
UPDATE models SET 
  default_cfg = 3.5,
  max_cfg = 10,
  default_steps = 25,
  max_steps = 50,
  metadata = jsonb_build_object(
    'supports_prompt_upsampling', true,
    'supports_seed', true
  )
WHERE model_id LIKE 'fal-ai/flux%';

-- Update metadata for fast-sdxl with specific configurations
UPDATE models SET 
  default_cfg = 7.5,
  max_cfg = 20,
  default_steps = 25,
  max_steps = 50,
  max_images = 8,
  supports_both_size_modes = true,
  metadata = jsonb_build_object(
    'supports_seed', true,
    'supports_negative_prompt', true,
    'enable_safety_checker', true,
    'safety_checker_version', 'v1',
    'supported_formats', ARRAY['jpeg', 'png'],
    'default_format', 'jpeg',
    'expand_prompt', false,
    'supports_loras', true,
    'supports_embeddings', true,
    'sync_mode', false,
    'image_size_presets', jsonb_build_object(
      'square_hd', jsonb_build_object('width', 1024, 'height', 1024),
      'square', jsonb_build_object('width', 512, 'height', 512),
      'portrait_4_3', jsonb_build_object('width', 768, 'height', 1024),
      'portrait_16_9', jsonb_build_object('width', 576, 'height', 1024),
      'landscape_4_3', jsonb_build_object('width', 1024, 'height', 768),
      'landscape_16_9', jsonb_build_object('width', 1024, 'height', 576)
    ),
    'default_image_size', 'square_hd',
    'max_custom_size', 14142
  )
WHERE model_id = 'fal-ai/fast-sdxl';

-- Video Models
INSERT INTO models (
  model_id, name, type, cost_per_mp, custom_cost,
  supports_image_input, is_text_only, size_mode,
  supported_aspect_ratios, duration_options,
  supports_audio_generation, display_order, tags, is_default
) VALUES
('fal-ai/hunyuan-video', 'HunyuanVideo', 'video', 0.018, 0.018,
  true, false, 'aspect_ratio',
  ARRAY['1:1', '16:9', '9:16'],
  ARRAY[1, 2, 3, 4, 5],
  false, 200, ARRAY['video', 'high-quality'], true
);

-- Audio Models  
INSERT INTO models (
  model_id, name, type, cost_per_mp, custom_cost,
  is_text_only, display_order, tags,
  metadata, is_default
) VALUES
('resemble-ai/chatterboxhd/text-to-speech', 'ChatterboxHD TTS', 'audio', 0.00025, 0.00025,
  true, 300, ARRAY['tts', 'voice'],
  jsonb_build_object(
    'supports_voice_cloning', true,
    'max_text_length', 5000,
    'supported_languages', ARRAY['en'],
    'voice_presets', ARRAY['default', 'male', 'female']
  ), true
);

-- Add comments
COMMENT ON TABLE models IS 'AI model configurations populated from existing system';

-- Create default admin user models view
CREATE OR REPLACE VIEW admin_active_models AS
SELECT 
  id,
  model_id,
  name,
  type,
  cost_per_mp,
  custom_cost,
  custom_cost / 0.001 as mp_cost,
  is_active,
  is_default,
  tags,
  display_order
FROM models
WHERE is_active = true
ORDER BY display_order, name;

-- Grant permissions
GRANT SELECT ON admin_active_models TO authenticated;