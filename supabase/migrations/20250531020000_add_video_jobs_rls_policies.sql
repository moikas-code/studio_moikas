-- Add RLS policies for video_jobs table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own video jobs" ON public.video_jobs;
DROP POLICY IF EXISTS "Users can insert their own video jobs" ON public.video_jobs;
DROP POLICY IF EXISTS "Service role can do everything" ON public.video_jobs;

-- Policy: Users can view their own video jobs
CREATE POLICY "Users can view their own video jobs" ON public.video_jobs
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Policy: Users can insert their own video jobs
CREATE POLICY "Users can insert their own video jobs" ON public.video_jobs
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users WHERE clerk_id = auth.jwt() ->> 'sub'
  )
);

-- Policy: Service role can do everything (for webhooks and admin)
CREATE POLICY "Service role can do everything" ON public.video_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add index on clerk_id for better performance
CREATE INDEX IF NOT EXISTS users_clerk_id_idx ON public.users USING btree (clerk_id);