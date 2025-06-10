-- Fix usage table schema to add missing columns

-- Add missing columns to usage table
ALTER TABLE usage 
ADD COLUMN IF NOT EXISTS operation_type TEXT,
ADD COLUMN IF NOT EXISTS action TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS details JSONB;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_usage_operation_type ON usage(operation_type);
CREATE INDEX IF NOT EXISTS idx_usage_created_at ON usage(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON usage(user_id);

-- Add check constraint for valid operation types
ALTER TABLE usage 
DROP CONSTRAINT IF EXISTS valid_operation_type;

ALTER TABLE usage 
ADD CONSTRAINT valid_operation_type CHECK (
  operation_type IS NULL OR 
  operation_type IN (
    'image_generation', 
    'video_generation', 
    'audio_generation', 
    'text_analysis', 
    'memu_chat',
    'chat_completion'
  )
);

-- Update existing records to have operation_type based on description patterns
-- This is a more accurate approach than guessing from token amounts
UPDATE usage 
SET operation_type = CASE 
  WHEN description ILIKE '%video generation%' THEN 'video_generation'
  WHEN description ILIKE '%image generation%' THEN 'image_generation'
  WHEN description ILIKE '%text-to-speech%' OR description ILIKE '%audio%' THEN 'audio_generation'
  WHEN description ILIKE '%text analysis%' OR description ILIKE '%prompt enhancement%' THEN 'text_analysis'
  WHEN description ILIKE '%chat%' OR description ILIKE '%memu%' THEN 'memu_chat'
  ELSE 'chat_completion'
END
WHERE operation_type IS NULL;

-- For any remaining NULL operation_types, make a best guess based on token usage
UPDATE usage 
SET operation_type = CASE 
  WHEN tokens_used >= 450 THEN 'video_generation'
  WHEN tokens_used >= 50 THEN 'image_generation'
  WHEN tokens_used >= 10 THEN 'audio_generation'
  ELSE 'text_analysis'
END
WHERE operation_type IS NULL;

-- Add RLS policy for usage table if not exists
ALTER TABLE usage ENABLE ROW LEVEL SECURITY;

-- Users can only see their own usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usage' 
    AND policyname = 'Users can view own usage'
  ) THEN
    CREATE POLICY "Users can view own usage" ON usage
      FOR SELECT
      USING (user_id = get_user_id_from_clerk());
  END IF;
END $$;

-- Admins can view all usage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'usage' 
    AND policyname = 'Admins can view all usage'
  ) THEN
    CREATE POLICY "Admins can view all usage" ON usage
      FOR SELECT
      USING (is_current_user_admin());
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN usage.operation_type IS 'Type of operation: image_generation, video_generation, audio_generation, text_analysis, memu_chat, chat_completion';
COMMENT ON COLUMN usage.action IS 'Specific action performed within the operation type';
COMMENT ON COLUMN usage.description IS 'Human-readable description of the usage';
COMMENT ON COLUMN usage.metadata IS 'Additional metadata about the operation';
COMMENT ON COLUMN usage.details IS 'Detailed information about the operation';

-- Create usage analytics view (now that operation_type exists)
CREATE OR REPLACE VIEW admin_usage_stats AS
SELECT 
  COUNT(*) as total_operations,
  SUM(tokens_used) as total_tokens_used,
  AVG(tokens_used) as avg_tokens_per_operation,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(CASE WHEN operation_type = 'image_generation' THEN 1 END) as image_generations,
  COUNT(CASE WHEN operation_type = 'video_generation' THEN 1 END) as video_generations,
  COUNT(CASE WHEN operation_type = 'audio_generation' THEN 1 END) as audio_generations,
  COUNT(CASE WHEN operation_type = 'text_analysis' THEN 1 END) as text_analyses,
  COUNT(CASE WHEN operation_type = 'memu_chat' THEN 1 END) as memu_chats
FROM usage
WHERE created_at >= NOW() - INTERVAL '30 days';

-- Create daily usage trends view
CREATE OR REPLACE VIEW admin_daily_usage_trends AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as daily_active_users,
  COUNT(*) as total_operations,
  SUM(tokens_used) as tokens_consumed,
  COUNT(CASE WHEN operation_type = 'image_generation' THEN 1 END) as images_generated,
  COUNT(CASE WHEN operation_type = 'video_generation' THEN 1 END) as videos_generated
FROM usage
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Note: Views are accessible to authenticated users by default
-- Additional permissions can be added later if needed