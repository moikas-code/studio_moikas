-- Create image_jobs table for tracking async image generation
CREATE TABLE IF NOT EXISTS public.image_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    job_id TEXT UNIQUE NOT NULL,
    fal_request_id TEXT UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    prompt TEXT NOT NULL,
    model TEXT NOT NULL,
    image_size TEXT NOT NULL,
    num_images INTEGER NOT NULL DEFAULT 1,
    image_url TEXT,
    error TEXT,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    cost INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX idx_image_jobs_user_id ON public.image_jobs(user_id);
CREATE INDEX idx_image_jobs_job_id ON public.image_jobs(job_id);
CREATE INDEX idx_image_jobs_fal_request_id ON public.image_jobs(fal_request_id);
CREATE INDEX idx_image_jobs_status ON public.image_jobs(status);
CREATE INDEX idx_image_jobs_created_at ON public.image_jobs(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_image_jobs_updated_at
    BEFORE UPDATE ON public.image_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.image_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own image jobs
CREATE POLICY "Users can view own image jobs"
    ON public.image_jobs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own image jobs
CREATE POLICY "Users can create own image jobs"
    ON public.image_jobs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own image jobs
CREATE POLICY "Users can update own image jobs"
    ON public.image_jobs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role can manage all image jobs (for webhooks)
CREATE POLICY "Service role can manage all image jobs"
    ON public.image_jobs
    FOR ALL
    USING (auth.role() = 'service_role');

-- Admin users can view all image jobs
CREATE POLICY "Admin users can view all image jobs"
    ON public.image_jobs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Admin users can update all image jobs
CREATE POLICY "Admin users can update all image jobs"
    ON public.image_jobs
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Admin users can delete all image jobs
CREATE POLICY "Admin users can delete all image jobs"
    ON public.image_jobs
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- Function to automatically delete old image jobs (older than 7 days)
CREATE OR REPLACE FUNCTION delete_old_image_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.image_jobs
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
END;
$$;

-- Optional: Create a pg_cron job to run cleanup daily
-- Note: This requires pg_cron extension to be enabled
-- DO $$
-- BEGIN
--     IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
--         PERFORM cron.schedule(
--             'delete-old-image-jobs',
--             '0 2 * * *', -- Run at 2 AM daily
--             $$SELECT delete_old_image_jobs();$$
--         );
--     END IF;
-- END $$;

-- Grant necessary permissions
GRANT ALL ON public.image_jobs TO authenticated;
GRANT ALL ON public.image_jobs TO service_role;

-- Enable realtime for image_jobs table
ALTER PUBLICATION supabase_realtime ADD TABLE public.image_jobs;