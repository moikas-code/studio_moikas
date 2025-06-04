-- Add missing columns to video_jobs table
ALTER TABLE "public"."video_jobs" 
ADD COLUMN IF NOT EXISTS "progress" integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone,
ADD COLUMN IF NOT EXISTS "metadata" jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS "cost" integer,
ADD COLUMN IF NOT EXISTS "fal_request_id" text;

-- Rename error_message to error for consistency with the code
ALTER TABLE "public"."video_jobs" 
RENAME COLUMN "error_message" TO "error";

-- Create index on fal_request_id for faster webhook lookups
CREATE INDEX IF NOT EXISTS video_jobs_fal_request_id_idx ON public.video_jobs USING btree (fal_request_id);