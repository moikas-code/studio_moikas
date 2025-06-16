-- Create user deletion requests table
CREATE TABLE IF NOT EXISTS public.user_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  clerk_id TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_deletion_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, status)
);

-- Create index for efficient queries
CREATE INDEX idx_deletion_requests_status ON public.user_deletion_requests(status);
CREATE INDEX idx_deletion_requests_scheduled_date ON public.user_deletion_requests(scheduled_deletion_date);

-- Create function to process pending deletions
CREATE OR REPLACE FUNCTION process_user_deletions() RETURNS void AS $$
DECLARE
  deletion_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Find all pending deletions past their scheduled date
  FOR deletion_record IN 
    SELECT * FROM public.user_deletion_requests 
    WHERE status = 'pending' 
    AND scheduled_deletion_date <= NOW()
  LOOP
    BEGIN
      -- Start transaction for each user
      -- Delete user data in order of dependencies
      
      -- Delete chat messages
      DELETE FROM public.workflow_messages WHERE session_id IN (
        SELECT id FROM public.workflow_sessions WHERE user_id = deletion_record.user_id
      );
      
      -- Delete chat sessions
      DELETE FROM public.workflow_sessions WHERE user_id = deletion_record.user_id;
      
      -- Delete workflow nodes
      DELETE FROM public.workflow_nodes WHERE workflow_id IN (
        SELECT id FROM public.workflows WHERE user_id = deletion_record.user_id
      );
      
      -- Delete workflows
      DELETE FROM public.workflows WHERE user_id = deletion_record.user_id;
      
      -- Delete jobs
      DELETE FROM public.image_jobs WHERE user_id = deletion_record.user_id;
      DELETE FROM public.video_jobs WHERE user_id = deletion_record.user_id;
      DELETE FROM public.audio_jobs WHERE user_id = deletion_record.user_id;
      
      -- Delete usage records
      DELETE FROM public.usage WHERE user_id = deletion_record.user_id;
      
      -- Delete billing transactions
      DELETE FROM public.billing_transactions WHERE user_id = deletion_record.user_id;
      
      -- Delete moderation logs
      DELETE FROM public.moderation_logs WHERE user_id = deletion_record.user_id;
      
      -- Delete subscription
      DELETE FROM public.subscriptions WHERE user_id = deletion_record.user_id;
      
      -- Finally, delete the user
      DELETE FROM public.users WHERE id = deletion_record.user_id;
      
      -- Mark deletion as completed
      UPDATE public.user_deletion_requests 
      SET 
        status = 'completed',
        completed_at = NOW()
      WHERE id = deletion_record.id;
      
      deleted_count := deleted_count + 1;
      
      -- Log the deletion
      INSERT INTO public.system_logs (action, details)
      VALUES (
        'user_deletion',
        jsonb_build_object(
          'user_id', deletion_record.user_id,
          'clerk_id', deletion_record.clerk_id,
          'requested_at', deletion_record.requested_at,
          'completed_at', NOW()
        )
      );
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error but continue with other deletions
      RAISE WARNING 'Failed to delete user %: %', deletion_record.user_id, SQLERRM;
      
      INSERT INTO public.system_logs (action, details)
      VALUES (
        'user_deletion_error',
        jsonb_build_object(
          'user_id', deletion_record.user_id,
          'error', SQLERRM
        )
      );
    END;
  END LOOP;
  
  IF deleted_count > 0 THEN
    RAISE NOTICE 'Processed % user deletions', deleted_count;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE public.user_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users can only view their own deletion requests
CREATE POLICY "Users can view own deletion requests" ON public.user_deletion_requests
  FOR SELECT
  USING (auth.uid()::text = clerk_id);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages deletion requests" ON public.user_deletion_requests
  FOR ALL
  USING (auth.role() = 'service_role');

-- Schedule deletion processing (if pg_cron is available)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Run every hour to process pending deletions
    PERFORM cron.schedule(
      'process-user-deletions',
      '0 * * * *',
      'SELECT process_user_deletions();'
    );
  END IF;
END $$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_user_deletions TO postgres;

-- Add comments
COMMENT ON TABLE public.user_deletion_requests IS 'Tracks user account deletion requests with 30-day grace period';
COMMENT ON FUNCTION process_user_deletions IS 'Processes pending user deletions after grace period expires';