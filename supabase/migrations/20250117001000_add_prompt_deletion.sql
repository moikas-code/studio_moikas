-- Create function to delete old prompts across all tables
CREATE OR REPLACE FUNCTION delete_old_prompts() RETURNS void AS $$
DECLARE
  deleted_image_jobs INTEGER;
  deleted_video_jobs INTEGER;
  deleted_audio_jobs INTEGER;
  deleted_moderation_logs INTEGER;
BEGIN
  -- Delete prompts from image_jobs older than 7 days
  WITH deleted AS (
    UPDATE public.image_jobs
    SET prompt = '[DELETED FOR PRIVACY]'
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND prompt != '[DELETED FOR PRIVACY]'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_image_jobs FROM deleted;

  -- Delete prompts from video_jobs older than 7 days
  WITH deleted AS (
    UPDATE public.video_jobs
    SET prompt = '[DELETED FOR PRIVACY]'
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND prompt != '[DELETED FOR PRIVACY]'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_video_jobs FROM deleted;

  -- Delete prompts from audio_jobs older than 7 days
  -- Audio jobs might have text content instead of prompts
  WITH deleted AS (
    UPDATE public.audio_jobs
    SET 
      text = CASE 
        WHEN LENGTH(text) > 50 THEN '[DELETED FOR PRIVACY]'
        ELSE text 
      END
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND text NOT LIKE '[DELETED%'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_audio_jobs FROM deleted;

  -- Delete prompts from moderation_logs older than 90 days (per policy)
  WITH deleted AS (
    UPDATE public.moderation_logs
    SET prompt = '[DELETED FOR PRIVACY]'
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND prompt != '[DELETED FOR PRIVACY]'
    RETURNING 1
  )
  SELECT COUNT(*) INTO deleted_moderation_logs FROM deleted;

  -- Log the deletion activity
  INSERT INTO public.system_logs (
    action,
    details,
    created_at
  ) VALUES (
    'prompt_deletion',
    jsonb_build_object(
      'image_jobs_cleaned', deleted_image_jobs,
      'video_jobs_cleaned', deleted_video_jobs,
      'audio_jobs_cleaned', deleted_audio_jobs,
      'moderation_logs_cleaned', deleted_moderation_logs,
      'total_cleaned', deleted_image_jobs + deleted_video_jobs + deleted_audio_jobs + deleted_moderation_logs
    ),
    NOW()
  );

  RAISE NOTICE 'Deleted prompts - Image: %, Video: %, Audio: %, Moderation: %', 
    deleted_image_jobs, deleted_video_jobs, deleted_audio_jobs, deleted_moderation_logs;
END;
$$ LANGUAGE plpgsql;

-- Create system_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_system_logs_action ON public.system_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);

-- Create a scheduled job using pg_cron (if available)
-- Note: pg_cron must be enabled in Supabase
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule the job to run daily at 3 AM UTC
    PERFORM cron.schedule(
      'delete-old-prompts',
      '0 3 * * *',
      'SELECT delete_old_prompts();'
    );
  END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION delete_old_prompts TO postgres;

-- Add comment for clarity
COMMENT ON FUNCTION delete_old_prompts IS 'Deletes prompts older than 7 days (90 days for moderation logs) to comply with privacy policy';