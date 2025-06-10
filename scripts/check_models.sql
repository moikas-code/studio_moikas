-- Check what models exist in the database
SELECT model_id, name, type, is_active, is_default
FROM models
WHERE type = 'video'
ORDER BY display_order, name;