-- Remove the UNIQUE constraint from model_id column
-- This allows multiple entries with the same model_id (e.g., for different configurations)

-- First, we need to find the constraint name
-- The constraint is likely named something like "models_model_id_key"
ALTER TABLE models DROP CONSTRAINT IF EXISTS models_model_id_key;

-- Add a comment explaining why model_id is no longer unique
COMMENT ON COLUMN models.model_id IS 'Model identifier used in API calls (e.g., "fal-ai/flux/schnell"). Not unique to allow multiple configurations of the same model.';

-- Since model_id is no longer unique, we might want to add a composite unique constraint
-- or a different way to identify unique model configurations
-- For example, you could add a unique constraint on (model_id, name) or (model_id, metadata)

-- Optional: Add a configuration name or variant field to distinguish between duplicates
ALTER TABLE models ADD COLUMN IF NOT EXISTS variant_name TEXT;
ALTER TABLE models ADD COLUMN IF NOT EXISTS configuration_id TEXT;

-- Add comments for new columns
COMMENT ON COLUMN models.variant_name IS 'Optional name to distinguish between different configurations of the same model_id';
COMMENT ON COLUMN models.configuration_id IS 'Optional unique identifier for this specific configuration';

-- Create an index on model_id for performance (since it's no longer unique but still used for lookups)
-- Drop the old unique index if it exists
DROP INDEX IF EXISTS idx_models_model_id;

-- Create a new non-unique index
CREATE INDEX idx_models_model_id ON models(model_id);

-- Optional: Create a composite index for common query patterns
CREATE INDEX idx_models_model_id_active ON models(model_id, is_active);

-- If you want to ensure some level of uniqueness, you could add a composite unique constraint
-- For example, to ensure no duplicate active models with the same model_id:
-- ALTER TABLE models ADD CONSTRAINT unique_active_model_id UNIQUE (model_id, is_active) WHERE is_active = true;

-- Or to ensure unique model_id + variant_name combinations:
-- ALTER TABLE models ADD CONSTRAINT unique_model_variant UNIQUE (model_id, variant_name);

-- Update existing models to have a variant_name if there are duplicates
UPDATE models 
SET variant_name = 'default' 
WHERE variant_name IS NULL 
AND model_id IN (
  SELECT model_id 
  FROM models 
  GROUP BY model_id 
  HAVING COUNT(*) = 1
);

-- For any existing duplicates, add a number suffix
WITH numbered_models AS (
  SELECT 
    id,
    model_id,
    ROW_NUMBER() OVER (PARTITION BY model_id ORDER BY created_at) as rn
  FROM models
  WHERE model_id IN (
    SELECT model_id 
    FROM models 
    GROUP BY model_id 
    HAVING COUNT(*) > 1
  )
)
UPDATE models m
SET variant_name = 'variant_' || nm.rn
FROM numbered_models nm
WHERE m.id = nm.id;