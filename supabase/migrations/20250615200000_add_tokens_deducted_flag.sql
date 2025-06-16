-- Add tokens_deducted flag to track if tokens have been deducted for a job
ALTER TABLE public.image_jobs 
ADD COLUMN tokens_deducted BOOLEAN DEFAULT FALSE;

-- Update existing completed jobs to mark tokens as deducted
-- (since they were deducted under the old system)
UPDATE public.image_jobs 
SET tokens_deducted = TRUE 
WHERE status = 'completed' 
AND created_at < NOW();

-- Add comment explaining the column
COMMENT ON COLUMN public.image_jobs.tokens_deducted IS 'Tracks whether tokens have been deducted for this job. Used to prevent double deduction when transitioning to deduct-on-completion model.';