-- Add missing fields for webhook integration
ALTER TABLE "public"."video_jobs" 
ADD COLUMN IF NOT EXISTS "gateway_request_id" text,
ADD COLUMN IF NOT EXISTS "result_payload" jsonb,
ADD COLUMN IF NOT EXISTS "error_payload" jsonb,
ADD COLUMN IF NOT EXISTS "image_urls" text[];

-- Create index on job_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS video_jobs_job_id_idx ON public.video_jobs USING btree (job_id);