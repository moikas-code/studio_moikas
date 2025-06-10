-- Update fast-sdxl to support both size modes
UPDATE models 
SET supports_both_size_modes = true
WHERE model_id = 'fal-ai/fast-sdxl';