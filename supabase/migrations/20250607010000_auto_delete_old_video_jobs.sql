-- Create a function to delete video jobs older than 7 days
CREATE OR REPLACE FUNCTION delete_old_video_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete video jobs older than 7 days
  DELETE FROM video_jobs
  WHERE created_at < NOW() - INTERVAL '7 days';
  
  -- Also delete audio jobs older than 7 days for consistency
  DELETE FROM audio_jobs
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Create a scheduled job to run daily at 2 AM UTC
-- Note: This requires pg_cron extension to be enabled
-- If pg_cron is not available, you can call this function from an external cron job

-- Try to create the cron job (will fail silently if pg_cron is not available)
DO $$
BEGIN
  -- Check if pg_cron is available
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Schedule the job to run daily at 2 AM UTC
    PERFORM cron.schedule(
      'delete-old-video-jobs',  -- job name
      '0 2 * * *',              -- cron expression (daily at 2 AM)
      'SELECT delete_old_video_jobs();'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Silently ignore if pg_cron is not available
    NULL;
END;
$$;

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_video_jobs_created_at ON video_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_audio_jobs_created_at ON audio_jobs(created_at);

-- Grant execute permission to authenticated users (optional)
-- This allows manual cleanup if needed
GRANT EXECUTE ON FUNCTION delete_old_video_jobs() TO authenticated;