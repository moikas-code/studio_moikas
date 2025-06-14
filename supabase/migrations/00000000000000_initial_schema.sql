-- Initial schema setup
-- This migration creates the base tables that other migrations depend on

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "clerk_id" text,
    "email" text,
    "stripe_customer_id" text,
    "created_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_clerk_id_key" UNIQUE ("clerk_id")
);

-- Create subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "plan" text,
    "renewable_tokens" numeric DEFAULT 125,
    "permanent_tokens" numeric DEFAULT 0,
    "renewed_at" timestamp without time zone,
    "pro_tokens_used" integer DEFAULT 0,
    "pro_tokens_cap" integer DEFAULT 1700,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

-- Create usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS "public"."usage" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "tokens_used" integer,
    "created_at" timestamp without time zone DEFAULT now(),
    CONSTRAINT "usage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id")
);

-- Enable RLS
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;

-- Create helper function to get user_id from Clerk JWT
CREATE OR REPLACE FUNCTION get_user_id_from_clerk()
RETURNS UUID AS $$
DECLARE
  clerk_id TEXT;
  user_id UUID;
BEGIN
  -- Get clerk_id from JWT
  clerk_id := current_setting('request.jwt.claims', true)::json->>'sub';
  
  IF clerk_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Look up user_id from clerk_id
  SELECT id INTO user_id
  FROM users
  WHERE users.clerk_id = clerk_id;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies will be created by subsequent migrations

-- Create video_jobs table if it doesn't exist (needed by other migrations)
CREATE TABLE IF NOT EXISTS "public"."video_jobs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "job_id" text NOT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "prompt" text,
    "negative_prompt" text,
    "model_id" text,
    "aspect" text,
    "duration" integer,
    "image_url" text,
    "video_url" text,
    "error_message" text,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "video_jobs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "video_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE
);

-- Create index
CREATE INDEX IF NOT EXISTS video_jobs_user_id_idx ON public.video_jobs USING btree (user_id);

-- Enable RLS for video_jobs
ALTER TABLE "public"."video_jobs" ENABLE ROW LEVEL SECURITY;

-- Create helper functions
CREATE OR REPLACE FUNCTION public.add_permanent_tokens(in_user_id uuid, in_tokens_to_add integer)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE subscriptions
  SET permanent_tokens = COALESCE(permanent_tokens, 0) + in_tokens_to_add
  WHERE user_id = in_user_id;
END;
$$;

-- Initial deduct_tokens function will be replaced by later migrations