-- Fix usage table operation_type NULL values and metadata issues
-- This migration updates any NULL operation_type values and fixes missing metadata fields
-- for proper cost type tracking in the admin analytics

-- First, update any NULL operation_type values based on description patterns
UPDATE usage
SET operation_type = CASE
    WHEN description ILIKE '%image generation%' OR action = 'image_generation' THEN 'image_generation'
    WHEN description ILIKE '%video%' OR action ILIKE '%video%' THEN 'video_generation'
    WHEN description ILIKE '%audio%' OR action ILIKE '%audio%' OR action ILIKE '%tts%' THEN 'audio_generation'
    WHEN description ILIKE '%chat%' OR action ILIKE '%chat%' OR action ILIKE '%memu%' THEN 'chat'
    WHEN description ILIKE '%text analysis%' OR action = 'text_analysis' THEN 'text_analysis'
    WHEN description ILIKE '%embedding%' OR action ILIKE '%embedding%' THEN 'embeddings'
    ELSE 'other'
END
WHERE operation_type IS NULL;

-- Fix metadata for records that don't have counted_as_plan set
-- This ensures the cost type displays correctly in analytics
UPDATE usage
SET metadata = 
    CASE 
        -- If metadata is NULL, create new object
        WHEN metadata IS NULL THEN 
            jsonb_build_object(
                'counted_as_plan', 
                COALESCE(
                    (SELECT s.plan FROM subscriptions s WHERE s.user_id = usage.user_id LIMIT 1),
                    'free'
                )
            )
        -- If metadata exists but doesn't have counted_as_plan
        WHEN metadata->>'counted_as_plan' IS NULL THEN
            metadata || jsonb_build_object(
                'counted_as_plan',
                COALESCE(
                    (SELECT s.plan FROM subscriptions s WHERE s.user_id = usage.user_id LIMIT 1),
                    'free'
                )
            )
        -- Otherwise keep existing metadata
        ELSE metadata
    END
WHERE metadata IS NULL OR metadata->>'counted_as_plan' IS NULL;

-- Now make the operation_type column NOT NULL with a default value
ALTER TABLE usage 
ALTER COLUMN operation_type SET NOT NULL,
ALTER COLUMN operation_type SET DEFAULT 'other';

-- Update the check constraint to ensure valid values
ALTER TABLE usage 
DROP CONSTRAINT IF EXISTS usage_operation_type_check;

ALTER TABLE usage 
ADD CONSTRAINT usage_operation_type_check 
CHECK (operation_type IN ('image_generation', 'video_generation', 'audio_generation', 'chat', 'text_analysis', 'embeddings', 'other'));

-- Add a comment to document the allowed values
COMMENT ON COLUMN usage.operation_type IS 'Type of operation: image_generation, video_generation, audio_generation, chat, text_analysis, embeddings, or other';