create type "public"."billing_type" as enum ('flat_rate', 'time_based');

drop view if exists "public"."admin_user_stats";

create table "public"."controlnet_configs" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "path" text not null,
    "config_url" text,
    "variant" text,
    "type" text not null,
    "description" text,
    "conditioning_scale" numeric(3,2) default 1.0,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid
);


alter table "public"."controlnet_configs" enable row level security;

create table "public"."dmca_actions" (
    "id" uuid not null default gen_random_uuid(),
    "dmca_request_id" uuid not null,
    "action" text not null,
    "performed_by" text,
    "details" jsonb,
    "created_at" timestamp with time zone default now()
);


alter table "public"."dmca_actions" enable row level security;

create table "public"."dmca_requests" (
    "id" uuid not null default gen_random_uuid(),
    "complainant_email" text not null,
    "complainant_name" text not null,
    "complainant_address" text,
    "complainant_phone" text,
    "copyrighted_work" text not null,
    "original_work_url" text,
    "infringing_content_url" text not null,
    "infringing_content_description" text,
    "reported_user_id" uuid,
    "good_faith_statement" boolean not null default false,
    "accuracy_statement" boolean not null default false,
    "signature" text not null,
    "status" text not null default 'pending'::text,
    "admin_notes" text,
    "rejection_reason" text,
    "counter_notice_received_at" timestamp with time zone,
    "counter_notice_text" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "reviewed_at" timestamp with time zone,
    "resolved_at" timestamp with time zone
);


alter table "public"."dmca_requests" enable row level security;

create table "public"."embedding_configs" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "path" text not null,
    "tokens" text[] not null default ARRAY['<s0>'::text, '<s1>'::text],
    "description" text,
    "tags" text[] default ARRAY[]::text[],
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid
);


alter table "public"."embedding_configs" enable row level security;

create table "public"."image_jobs" (
    "id" uuid not null default uuid_generate_v4(),
    "user_id" uuid not null,
    "job_id" text not null,
    "fal_request_id" text,
    "status" text not null default 'pending'::text,
    "prompt" text not null,
    "model" text not null,
    "image_size" text not null,
    "num_images" integer not null default 1,
    "image_url" text,
    "error" text,
    "progress" integer default 0,
    "cost" integer not null default 0,
    "metadata" jsonb default '{}'::jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "completed_at" timestamp with time zone,
    "tokens_deducted" boolean default false
);


alter table "public"."image_jobs" enable row level security;

create table "public"."lora_configs" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "path" text not null,
    "scale" numeric(3,2) default 1.0,
    "description" text,
    "tags" text[] default ARRAY[]::text[],
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "created_by" uuid
);


alter table "public"."lora_configs" enable row level security;

create table "public"."moderation_logs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "prompt" text not null,
    "safe" boolean not null,
    "violations" text[] default '{}'::text[],
    "confidence" numeric(3,2) not null,
    "false_positive_reported" boolean default false,
    "false_positive_reviewed" boolean default false,
    "false_positive_notes" text,
    "model_used" text default 'grok-3-mini-latest'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."moderation_logs" enable row level security;

create table "public"."system_logs" (
    "id" uuid not null default gen_random_uuid(),
    "action" character varying(100) not null,
    "details" jsonb,
    "created_at" timestamp with time zone default now()
);


create table "public"."user_deletion_requests" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "clerk_id" text not null,
    "requested_at" timestamp with time zone not null default now(),
    "scheduled_deletion_date" timestamp with time zone not null,
    "reason" text,
    "status" text not null default 'pending'::text,
    "cancelled_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."user_deletion_requests" enable row level security;

alter table "public"."models" add column "billing_type" billing_type not null default 'flat_rate'::billing_type;

alter table "public"."models" add column "default_clip_skip" integer default 0;

alter table "public"."models" add column "default_eta" numeric(3,2) default 0;

alter table "public"."models" add column "default_prediction_type" text default 'epsilon'::text;

alter table "public"."models" add column "default_scheduler" text;

alter table "public"."models" add column "default_tile_height" integer;

alter table "public"."models" add column "default_tile_width" integer;

alter table "public"."models" add column "default_variant" text;

alter table "public"."models" add column "has_safety_checker" boolean default true;

alter table "public"."models" add column "max_clip_skip" integer default 2;

alter table "public"."models" add column "max_eta" numeric(3,2) default 1;

alter table "public"."models" add column "max_tile_height" integer;

alter table "public"."models" add column "max_tile_width" integer;

alter table "public"."models" add column "max_time_charge_seconds" numeric(10,2);

alter table "public"."models" add column "min_cfg" numeric(4,2) default 0;

alter table "public"."models" add column "min_time_charge_seconds" numeric(10,2) default 1;

alter table "public"."models" add column "supported_prediction_types" text[] default ARRAY['epsilon'::text];

alter table "public"."models" add column "supported_schedulers" text[] default ARRAY[]::text[];

alter table "public"."models" add column "supported_variants" text[] default ARRAY[]::text[];

alter table "public"."models" add column "supports_clip_skip" boolean default false;

alter table "public"."models" add column "supports_controlnet" boolean default false;

alter table "public"."models" add column "supports_custom_sigmas" boolean default false;

alter table "public"."models" add column "supports_custom_timesteps" boolean default false;

alter table "public"."models" add column "supports_embeddings" boolean default false;

alter table "public"."models" add column "supports_eta" boolean default false;

alter table "public"."models" add column "supports_ip_adapter" boolean default false;

alter table "public"."models" add column "supports_loras" boolean default false;

alter table "public"."models" add column "supports_prompt_weighting" boolean default false;

alter table "public"."models" add column "supports_tile_size" boolean default false;

alter table "public"."users" add column "age_verified_at" timestamp with time zone;

alter table "public"."users" add column "birth_date" date;

alter table "public"."users" add column "region" character varying(10);

CREATE UNIQUE INDEX controlnet_configs_pkey ON public.controlnet_configs USING btree (id);

CREATE UNIQUE INDEX dmca_actions_pkey ON public.dmca_actions USING btree (id);

CREATE UNIQUE INDEX dmca_requests_pkey ON public.dmca_requests USING btree (id);

CREATE UNIQUE INDEX embedding_configs_pkey ON public.embedding_configs USING btree (id);

CREATE INDEX idx_controlnet_configs_is_active ON public.controlnet_configs USING btree (is_active);

CREATE INDEX idx_controlnet_configs_name ON public.controlnet_configs USING btree (name);

CREATE INDEX idx_controlnet_configs_type ON public.controlnet_configs USING btree (type);

CREATE INDEX idx_deletion_requests_scheduled_date ON public.user_deletion_requests USING btree (scheduled_deletion_date);

CREATE INDEX idx_deletion_requests_status ON public.user_deletion_requests USING btree (status);

CREATE INDEX idx_dmca_requests_created_at ON public.dmca_requests USING btree (created_at);

CREATE INDEX idx_dmca_requests_reported_user ON public.dmca_requests USING btree (reported_user_id);

CREATE INDEX idx_dmca_requests_status ON public.dmca_requests USING btree (status);

CREATE INDEX idx_embedding_configs_created_by ON public.embedding_configs USING btree (created_by);

CREATE INDEX idx_embedding_configs_is_active ON public.embedding_configs USING btree (is_active);

CREATE INDEX idx_embedding_configs_name ON public.embedding_configs USING btree (name);

CREATE INDEX idx_image_jobs_created_at ON public.image_jobs USING btree (created_at);

CREATE INDEX idx_image_jobs_fal_request_id ON public.image_jobs USING btree (fal_request_id);

CREATE INDEX idx_image_jobs_job_id ON public.image_jobs USING btree (job_id);

CREATE INDEX idx_image_jobs_status ON public.image_jobs USING btree (status);

CREATE INDEX idx_image_jobs_user_id ON public.image_jobs USING btree (user_id);

CREATE INDEX idx_lora_configs_created_by ON public.lora_configs USING btree (created_by);

CREATE INDEX idx_lora_configs_is_active ON public.lora_configs USING btree (is_active);

CREATE INDEX idx_lora_configs_name ON public.lora_configs USING btree (name);

CREATE INDEX idx_moderation_logs_created_at ON public.moderation_logs USING btree (created_at DESC);

CREATE INDEX idx_moderation_logs_false_positive ON public.moderation_logs USING btree (false_positive_reported) WHERE (false_positive_reported = true);

CREATE INDEX idx_moderation_logs_safe ON public.moderation_logs USING btree (safe);

CREATE INDEX idx_moderation_logs_user_id ON public.moderation_logs USING btree (user_id);

CREATE INDEX idx_moderation_logs_violations ON public.moderation_logs USING gin (violations);

CREATE INDEX idx_system_logs_action ON public.system_logs USING btree (action);

CREATE INDEX idx_system_logs_created_at ON public.system_logs USING btree (created_at);

CREATE INDEX idx_users_region ON public.users USING btree (region);

CREATE UNIQUE INDEX image_jobs_fal_request_id_key ON public.image_jobs USING btree (fal_request_id);

CREATE UNIQUE INDEX image_jobs_job_id_key ON public.image_jobs USING btree (job_id);

CREATE UNIQUE INDEX image_jobs_pkey ON public.image_jobs USING btree (id);

CREATE UNIQUE INDEX lora_configs_pkey ON public.lora_configs USING btree (id);

CREATE UNIQUE INDEX moderation_logs_pkey ON public.moderation_logs USING btree (id);

CREATE UNIQUE INDEX system_logs_pkey ON public.system_logs USING btree (id);

CREATE UNIQUE INDEX user_deletion_requests_pkey ON public.user_deletion_requests USING btree (id);

CREATE UNIQUE INDEX user_deletion_requests_user_id_status_key ON public.user_deletion_requests USING btree (user_id, status);

alter table "public"."controlnet_configs" add constraint "controlnet_configs_pkey" PRIMARY KEY using index "controlnet_configs_pkey";

alter table "public"."dmca_actions" add constraint "dmca_actions_pkey" PRIMARY KEY using index "dmca_actions_pkey";

alter table "public"."dmca_requests" add constraint "dmca_requests_pkey" PRIMARY KEY using index "dmca_requests_pkey";

alter table "public"."embedding_configs" add constraint "embedding_configs_pkey" PRIMARY KEY using index "embedding_configs_pkey";

alter table "public"."image_jobs" add constraint "image_jobs_pkey" PRIMARY KEY using index "image_jobs_pkey";

alter table "public"."lora_configs" add constraint "lora_configs_pkey" PRIMARY KEY using index "lora_configs_pkey";

alter table "public"."moderation_logs" add constraint "moderation_logs_pkey" PRIMARY KEY using index "moderation_logs_pkey";

alter table "public"."system_logs" add constraint "system_logs_pkey" PRIMARY KEY using index "system_logs_pkey";

alter table "public"."user_deletion_requests" add constraint "user_deletion_requests_pkey" PRIMARY KEY using index "user_deletion_requests_pkey";

alter table "public"."controlnet_configs" add constraint "controlnet_configs_conditioning_scale_check" CHECK (((conditioning_scale >= (0)::numeric) AND (conditioning_scale <= (2)::numeric))) not valid;

alter table "public"."controlnet_configs" validate constraint "controlnet_configs_conditioning_scale_check";

alter table "public"."controlnet_configs" add constraint "controlnet_configs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."controlnet_configs" validate constraint "controlnet_configs_created_by_fkey";

alter table "public"."dmca_actions" add constraint "dmca_actions_dmca_request_id_fkey" FOREIGN KEY (dmca_request_id) REFERENCES dmca_requests(id) ON DELETE CASCADE not valid;

alter table "public"."dmca_actions" validate constraint "dmca_actions_dmca_request_id_fkey";

alter table "public"."dmca_requests" add constraint "dmca_requests_reported_user_id_fkey" FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL not valid;

alter table "public"."dmca_requests" validate constraint "dmca_requests_reported_user_id_fkey";

alter table "public"."dmca_requests" add constraint "dmca_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'accepted'::text, 'rejected'::text, 'counter_notice_received'::text, 'resolved'::text]))) not valid;

alter table "public"."dmca_requests" validate constraint "dmca_requests_status_check";

alter table "public"."embedding_configs" add constraint "embedding_configs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."embedding_configs" validate constraint "embedding_configs_created_by_fkey";

alter table "public"."image_jobs" add constraint "image_jobs_fal_request_id_key" UNIQUE using index "image_jobs_fal_request_id_key";

alter table "public"."image_jobs" add constraint "image_jobs_job_id_key" UNIQUE using index "image_jobs_job_id_key";

alter table "public"."image_jobs" add constraint "image_jobs_progress_check" CHECK (((progress >= 0) AND (progress <= 100))) not valid;

alter table "public"."image_jobs" validate constraint "image_jobs_progress_check";

alter table "public"."image_jobs" add constraint "image_jobs_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))) not valid;

alter table "public"."image_jobs" validate constraint "image_jobs_status_check";

alter table "public"."image_jobs" add constraint "image_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."image_jobs" validate constraint "image_jobs_user_id_fkey";

alter table "public"."lora_configs" add constraint "lora_configs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES users(id) not valid;

alter table "public"."lora_configs" validate constraint "lora_configs_created_by_fkey";

alter table "public"."lora_configs" add constraint "lora_configs_scale_check" CHECK (((scale >= (0)::numeric) AND (scale <= (4)::numeric))) not valid;

alter table "public"."lora_configs" validate constraint "lora_configs_scale_check";

alter table "public"."moderation_logs" add constraint "moderation_logs_confidence_check" CHECK (((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))) not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_confidence_check";

alter table "public"."moderation_logs" add constraint "moderation_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."moderation_logs" validate constraint "moderation_logs_user_id_fkey";

alter table "public"."user_deletion_requests" add constraint "user_deletion_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text]))) not valid;

alter table "public"."user_deletion_requests" validate constraint "user_deletion_requests_status_check";

alter table "public"."user_deletion_requests" add constraint "user_deletion_requests_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."user_deletion_requests" validate constraint "user_deletion_requests_user_id_fkey";

alter table "public"."user_deletion_requests" add constraint "user_deletion_requests_user_id_status_key" UNIQUE using index "user_deletion_requests_user_id_status_key";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_user_age(birth_date date, region character varying DEFAULT NULL::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  min_age INTEGER;
  user_age INTEGER;
BEGIN
  -- Determine minimum age based on region
  IF region IN ('AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE') THEN
    min_age := 16; -- EU countries
  ELSE
    min_age := 13; -- Rest of world
  END IF;
  
  -- Calculate user age
  user_age := DATE_PART('year', AGE(birth_date));
  
  RETURN user_age >= min_age;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_old_image_jobs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.image_jobs
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.delete_old_prompts()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.get_moderation_stats(start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(total_checks bigint, total_blocked bigint, block_rate numeric, false_positive_reports bigint, false_positive_rate numeric, violations_breakdown jsonb, daily_stats jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE NOT safe) AS blocked,
      COUNT(*) FILTER (WHERE false_positive_reported) AS fp_reports
    FROM public.moderation_logs
    WHERE created_at BETWEEN start_date AND end_date
  ),
  violations AS (
    SELECT 
      unnest(violations) AS violation,
      COUNT(*) AS count
    FROM public.moderation_logs
    WHERE created_at BETWEEN start_date AND end_date
    AND NOT safe
    GROUP BY violation
  ),
  daily AS (
    SELECT 
      DATE(created_at) AS date,
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE NOT safe) AS blocked
    FROM public.moderation_logs
    WHERE created_at BETWEEN start_date AND end_date
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  )
  SELECT 
    stats.total,
    stats.blocked,
    CASE 
      WHEN stats.total > 0 
      THEN ROUND((stats.blocked::NUMERIC / stats.total) * 100, 2)
      ELSE 0
    END AS block_rate,
    stats.fp_reports,
    CASE 
      WHEN stats.blocked > 0 
      THEN ROUND((stats.fp_reports::NUMERIC / stats.blocked) * 100, 2)
      ELSE 0
    END AS false_positive_rate,
    COALESCE(
      (SELECT jsonb_object_agg(violation, count) FROM violations),
      '{}'::jsonb
    ) AS violations_breakdown,
    COALESCE(
      (SELECT jsonb_agg(row_to_json(daily.*)) FROM daily),
      '[]'::jsonb
    ) AS daily_stats
  FROM stats;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_dmca_action(request_id uuid, action_type text, performed_by_user text, action_details jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.dmca_actions (
    dmca_request_id,
    action,
    performed_by,
    details
  ) VALUES (
    request_id,
    action_type,
    performed_by_user,
    action_details
  );
  
  -- Update the updated_at timestamp on the request
  UPDATE public.dmca_requests
  SET updated_at = NOW()
  WHERE id = request_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.log_moderation_decision(p_user_id uuid, p_prompt text, p_safe boolean, p_violations text[], p_confidence numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.moderation_logs (
    user_id, 
    prompt, 
    safe, 
    violations, 
    confidence
  )
  VALUES (
    p_user_id,
    p_prompt,
    p_safe,
    p_violations,
    p_confidence
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_dmca_takedown(request_id uuid, admin_id text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  request_record RECORD;
BEGIN
  -- Get the DMCA request
  SELECT * INTO request_record
  FROM public.dmca_requests
  WHERE id = request_id
  AND status = 'reviewing';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Update request status
  UPDATE public.dmca_requests
  SET 
    status = 'accepted',
    reviewed_at = NOW()
  WHERE id = request_id;
  
  -- Log the action
  PERFORM log_dmca_action(
    request_id,
    'takedown_processed',
    admin_id,
    jsonb_build_object('infringing_url', request_record.infringing_content_url)
  );
  
  -- In a real implementation, you would:
  -- 1. Remove or disable access to the infringing content
  -- 2. Notify the user whose content was removed
  -- 3. Provide them with counter-notice information
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.process_user_deletions()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.verify_user_age(user_id uuid, birth_date date, region character varying DEFAULT NULL::character varying)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  is_valid_age BOOLEAN;
BEGIN
  -- Check if user meets age requirement
  is_valid_age := check_user_age(birth_date, region);
  
  IF is_valid_age THEN
    -- Update user record with verified age
    UPDATE public.users
    SET 
      birth_date = verify_user_age.birth_date,
      age_verified_at = NOW(),
      region = verify_user_age.region
    WHERE id = user_id;
    
    RETURN TRUE;
  ELSE
    -- Delete user if underage
    DELETE FROM public.users WHERE id = user_id;
    RETURN FALSE;
  END IF;
END;
$function$
;

create or replace view "public"."admin_user_stats" as  SELECT count(DISTINCT u.id) AS total_users,
    count(DISTINCT
        CASE
            WHEN (s.plan = 'standard'::text) THEN u.id
            ELSE NULL::uuid
        END) AS paid_users,
    count(DISTINCT
        CASE
            WHEN (s.plan = 'free'::text) THEN u.id
            ELSE NULL::uuid
        END) AS free_users,
    count(DISTINCT
        CASE
            WHEN (u.created_at >= (now() - '7 days'::interval)) THEN u.id
            ELSE NULL::uuid
        END) AS new_users_last_week,
    count(DISTINCT
        CASE
            WHEN (u.created_at >= (now() - '30 days'::interval)) THEN u.id
            ELSE NULL::uuid
        END) AS new_users_last_month
   FROM (users u
     LEFT JOIN subscriptions s ON ((u.id = s.user_id)));


CREATE OR REPLACE FUNCTION public.refund_tokens(p_user_id uuid, p_amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Update the subscription to add back the refunded tokens
  -- Priority: Add to renewable_tokens first, then permanent if needed
  UPDATE subscriptions
  SET 
    renewable_tokens = LEAST(renewable_tokens + p_amount, 
      CASE 
        WHEN plan = 'free' THEN 125 
        WHEN plan = 'standard' THEN 20480
        ELSE renewable_tokens + p_amount
      END),
    permanent_tokens = permanent_tokens + GREATEST(0, 
      p_amount - (CASE 
        WHEN plan = 'free' THEN 125 - renewable_tokens
        WHEN plan = 'standard' THEN 20480 - renewable_tokens
        ELSE 0
      END))
  WHERE user_id = p_user_id;
  
  -- Log the refund in usage table with negative amount
  INSERT INTO usage (user_id, tokens_used, description, created_at)
  VALUES (p_user_id, -p_amount, 'Token refund for failed video generation', NOW());
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."controlnet_configs" to "anon";

grant insert on table "public"."controlnet_configs" to "anon";

grant references on table "public"."controlnet_configs" to "anon";

grant select on table "public"."controlnet_configs" to "anon";

grant trigger on table "public"."controlnet_configs" to "anon";

grant truncate on table "public"."controlnet_configs" to "anon";

grant update on table "public"."controlnet_configs" to "anon";

grant delete on table "public"."controlnet_configs" to "authenticated";

grant insert on table "public"."controlnet_configs" to "authenticated";

grant references on table "public"."controlnet_configs" to "authenticated";

grant select on table "public"."controlnet_configs" to "authenticated";

grant trigger on table "public"."controlnet_configs" to "authenticated";

grant truncate on table "public"."controlnet_configs" to "authenticated";

grant update on table "public"."controlnet_configs" to "authenticated";

grant delete on table "public"."controlnet_configs" to "service_role";

grant insert on table "public"."controlnet_configs" to "service_role";

grant references on table "public"."controlnet_configs" to "service_role";

grant select on table "public"."controlnet_configs" to "service_role";

grant trigger on table "public"."controlnet_configs" to "service_role";

grant truncate on table "public"."controlnet_configs" to "service_role";

grant update on table "public"."controlnet_configs" to "service_role";

grant delete on table "public"."dmca_actions" to "anon";

grant insert on table "public"."dmca_actions" to "anon";

grant references on table "public"."dmca_actions" to "anon";

grant select on table "public"."dmca_actions" to "anon";

grant trigger on table "public"."dmca_actions" to "anon";

grant truncate on table "public"."dmca_actions" to "anon";

grant update on table "public"."dmca_actions" to "anon";

grant delete on table "public"."dmca_actions" to "authenticated";

grant insert on table "public"."dmca_actions" to "authenticated";

grant references on table "public"."dmca_actions" to "authenticated";

grant select on table "public"."dmca_actions" to "authenticated";

grant trigger on table "public"."dmca_actions" to "authenticated";

grant truncate on table "public"."dmca_actions" to "authenticated";

grant update on table "public"."dmca_actions" to "authenticated";

grant delete on table "public"."dmca_actions" to "service_role";

grant insert on table "public"."dmca_actions" to "service_role";

grant references on table "public"."dmca_actions" to "service_role";

grant select on table "public"."dmca_actions" to "service_role";

grant trigger on table "public"."dmca_actions" to "service_role";

grant truncate on table "public"."dmca_actions" to "service_role";

grant update on table "public"."dmca_actions" to "service_role";

grant delete on table "public"."dmca_requests" to "anon";

grant insert on table "public"."dmca_requests" to "anon";

grant references on table "public"."dmca_requests" to "anon";

grant select on table "public"."dmca_requests" to "anon";

grant trigger on table "public"."dmca_requests" to "anon";

grant truncate on table "public"."dmca_requests" to "anon";

grant update on table "public"."dmca_requests" to "anon";

grant delete on table "public"."dmca_requests" to "authenticated";

grant insert on table "public"."dmca_requests" to "authenticated";

grant references on table "public"."dmca_requests" to "authenticated";

grant select on table "public"."dmca_requests" to "authenticated";

grant trigger on table "public"."dmca_requests" to "authenticated";

grant truncate on table "public"."dmca_requests" to "authenticated";

grant update on table "public"."dmca_requests" to "authenticated";

grant delete on table "public"."dmca_requests" to "service_role";

grant insert on table "public"."dmca_requests" to "service_role";

grant references on table "public"."dmca_requests" to "service_role";

grant select on table "public"."dmca_requests" to "service_role";

grant trigger on table "public"."dmca_requests" to "service_role";

grant truncate on table "public"."dmca_requests" to "service_role";

grant update on table "public"."dmca_requests" to "service_role";

grant delete on table "public"."embedding_configs" to "anon";

grant insert on table "public"."embedding_configs" to "anon";

grant references on table "public"."embedding_configs" to "anon";

grant select on table "public"."embedding_configs" to "anon";

grant trigger on table "public"."embedding_configs" to "anon";

grant truncate on table "public"."embedding_configs" to "anon";

grant update on table "public"."embedding_configs" to "anon";

grant delete on table "public"."embedding_configs" to "authenticated";

grant insert on table "public"."embedding_configs" to "authenticated";

grant references on table "public"."embedding_configs" to "authenticated";

grant select on table "public"."embedding_configs" to "authenticated";

grant trigger on table "public"."embedding_configs" to "authenticated";

grant truncate on table "public"."embedding_configs" to "authenticated";

grant update on table "public"."embedding_configs" to "authenticated";

grant delete on table "public"."embedding_configs" to "service_role";

grant insert on table "public"."embedding_configs" to "service_role";

grant references on table "public"."embedding_configs" to "service_role";

grant select on table "public"."embedding_configs" to "service_role";

grant trigger on table "public"."embedding_configs" to "service_role";

grant truncate on table "public"."embedding_configs" to "service_role";

grant update on table "public"."embedding_configs" to "service_role";

grant delete on table "public"."image_jobs" to "anon";

grant insert on table "public"."image_jobs" to "anon";

grant references on table "public"."image_jobs" to "anon";

grant select on table "public"."image_jobs" to "anon";

grant trigger on table "public"."image_jobs" to "anon";

grant truncate on table "public"."image_jobs" to "anon";

grant update on table "public"."image_jobs" to "anon";

grant delete on table "public"."image_jobs" to "authenticated";

grant insert on table "public"."image_jobs" to "authenticated";

grant references on table "public"."image_jobs" to "authenticated";

grant select on table "public"."image_jobs" to "authenticated";

grant trigger on table "public"."image_jobs" to "authenticated";

grant truncate on table "public"."image_jobs" to "authenticated";

grant update on table "public"."image_jobs" to "authenticated";

grant delete on table "public"."image_jobs" to "service_role";

grant insert on table "public"."image_jobs" to "service_role";

grant references on table "public"."image_jobs" to "service_role";

grant select on table "public"."image_jobs" to "service_role";

grant trigger on table "public"."image_jobs" to "service_role";

grant truncate on table "public"."image_jobs" to "service_role";

grant update on table "public"."image_jobs" to "service_role";

grant delete on table "public"."lora_configs" to "anon";

grant insert on table "public"."lora_configs" to "anon";

grant references on table "public"."lora_configs" to "anon";

grant select on table "public"."lora_configs" to "anon";

grant trigger on table "public"."lora_configs" to "anon";

grant truncate on table "public"."lora_configs" to "anon";

grant update on table "public"."lora_configs" to "anon";

grant delete on table "public"."lora_configs" to "authenticated";

grant insert on table "public"."lora_configs" to "authenticated";

grant references on table "public"."lora_configs" to "authenticated";

grant select on table "public"."lora_configs" to "authenticated";

grant trigger on table "public"."lora_configs" to "authenticated";

grant truncate on table "public"."lora_configs" to "authenticated";

grant update on table "public"."lora_configs" to "authenticated";

grant delete on table "public"."lora_configs" to "service_role";

grant insert on table "public"."lora_configs" to "service_role";

grant references on table "public"."lora_configs" to "service_role";

grant select on table "public"."lora_configs" to "service_role";

grant trigger on table "public"."lora_configs" to "service_role";

grant truncate on table "public"."lora_configs" to "service_role";

grant update on table "public"."lora_configs" to "service_role";

grant delete on table "public"."moderation_logs" to "anon";

grant insert on table "public"."moderation_logs" to "anon";

grant references on table "public"."moderation_logs" to "anon";

grant select on table "public"."moderation_logs" to "anon";

grant trigger on table "public"."moderation_logs" to "anon";

grant truncate on table "public"."moderation_logs" to "anon";

grant update on table "public"."moderation_logs" to "anon";

grant delete on table "public"."moderation_logs" to "authenticated";

grant insert on table "public"."moderation_logs" to "authenticated";

grant references on table "public"."moderation_logs" to "authenticated";

grant select on table "public"."moderation_logs" to "authenticated";

grant trigger on table "public"."moderation_logs" to "authenticated";

grant truncate on table "public"."moderation_logs" to "authenticated";

grant update on table "public"."moderation_logs" to "authenticated";

grant delete on table "public"."moderation_logs" to "service_role";

grant insert on table "public"."moderation_logs" to "service_role";

grant references on table "public"."moderation_logs" to "service_role";

grant select on table "public"."moderation_logs" to "service_role";

grant trigger on table "public"."moderation_logs" to "service_role";

grant truncate on table "public"."moderation_logs" to "service_role";

grant update on table "public"."moderation_logs" to "service_role";

grant delete on table "public"."system_logs" to "anon";

grant insert on table "public"."system_logs" to "anon";

grant references on table "public"."system_logs" to "anon";

grant select on table "public"."system_logs" to "anon";

grant trigger on table "public"."system_logs" to "anon";

grant truncate on table "public"."system_logs" to "anon";

grant update on table "public"."system_logs" to "anon";

grant delete on table "public"."system_logs" to "authenticated";

grant insert on table "public"."system_logs" to "authenticated";

grant references on table "public"."system_logs" to "authenticated";

grant select on table "public"."system_logs" to "authenticated";

grant trigger on table "public"."system_logs" to "authenticated";

grant truncate on table "public"."system_logs" to "authenticated";

grant update on table "public"."system_logs" to "authenticated";

grant delete on table "public"."system_logs" to "service_role";

grant insert on table "public"."system_logs" to "service_role";

grant references on table "public"."system_logs" to "service_role";

grant select on table "public"."system_logs" to "service_role";

grant trigger on table "public"."system_logs" to "service_role";

grant truncate on table "public"."system_logs" to "service_role";

grant update on table "public"."system_logs" to "service_role";

grant delete on table "public"."user_deletion_requests" to "anon";

grant insert on table "public"."user_deletion_requests" to "anon";

grant references on table "public"."user_deletion_requests" to "anon";

grant select on table "public"."user_deletion_requests" to "anon";

grant trigger on table "public"."user_deletion_requests" to "anon";

grant truncate on table "public"."user_deletion_requests" to "anon";

grant update on table "public"."user_deletion_requests" to "anon";

grant delete on table "public"."user_deletion_requests" to "authenticated";

grant insert on table "public"."user_deletion_requests" to "authenticated";

grant references on table "public"."user_deletion_requests" to "authenticated";

grant select on table "public"."user_deletion_requests" to "authenticated";

grant trigger on table "public"."user_deletion_requests" to "authenticated";

grant truncate on table "public"."user_deletion_requests" to "authenticated";

grant update on table "public"."user_deletion_requests" to "authenticated";

grant delete on table "public"."user_deletion_requests" to "service_role";

grant insert on table "public"."user_deletion_requests" to "service_role";

grant references on table "public"."user_deletion_requests" to "service_role";

grant select on table "public"."user_deletion_requests" to "service_role";

grant trigger on table "public"."user_deletion_requests" to "service_role";

grant truncate on table "public"."user_deletion_requests" to "service_role";

grant update on table "public"."user_deletion_requests" to "service_role";

create policy "Admins can manage controlnet configs"
on "public"."controlnet_configs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


create policy "Public can view active controlnet configs"
on "public"."controlnet_configs"
as permissive
for select
to public
using ((is_active = true));


create policy "Admins can view DMCA actions"
on "public"."dmca_actions"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (users u
     JOIN subscriptions s ON ((u.id = s.user_id)))
  WHERE ((u.id = auth.uid()) AND (s.plan = 'admin'::text)))));


create policy "Admins can update DMCA requests"
on "public"."dmca_requests"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM (users u
     JOIN subscriptions s ON ((u.id = s.user_id)))
  WHERE ((u.id = auth.uid()) AND (s.plan = 'admin'::text)))));


create policy "Admins can view all DMCA requests"
on "public"."dmca_requests"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (users u
     JOIN subscriptions s ON ((u.id = s.user_id)))
  WHERE ((u.id = auth.uid()) AND (s.plan = 'admin'::text)))));


create policy "Anyone can submit DMCA requests"
on "public"."dmca_requests"
as permissive
for insert
to public
with check (true);


create policy "Complainants can view own requests"
on "public"."dmca_requests"
as permissive
for select
to public
using ((complainant_email = (auth.jwt() ->> 'email'::text)));


create policy "Admins can manage embedding configs"
on "public"."embedding_configs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


create policy "Public can view active embedding configs"
on "public"."embedding_configs"
as permissive
for select
to public
using ((is_active = true));


create policy "Admin users can delete all image jobs"
on "public"."image_jobs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text)))));


create policy "Admin users can update all image jobs"
on "public"."image_jobs"
as permissive
for update
to public
using ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text)))));


create policy "Admin users can view all image jobs"
on "public"."image_jobs"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM users u
  WHERE ((u.id = auth.uid()) AND (u.role = 'admin'::text)))));


create policy "Service role can manage all image jobs"
on "public"."image_jobs"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can create own image jobs"
on "public"."image_jobs"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update own image jobs"
on "public"."image_jobs"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view own image jobs"
on "public"."image_jobs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Admins can manage LoRA configs"
on "public"."lora_configs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


create policy "Public can view active LoRA configs"
on "public"."lora_configs"
as permissive
for select
to public
using ((is_active = true));


create policy "Admins can view all moderation logs"
on "public"."moderation_logs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = auth.uid()) AND (users.role = 'admin'::text)))));


create policy "Users can report false positives"
on "public"."moderation_logs"
as permissive
for update
to public
using (((auth.uid() = user_id) AND (false_positive_reported = false)))
with check (((auth.uid() = user_id) AND (false_positive_reported = true) AND (false_positive_reviewed = false)));


create policy "Users can view own moderation logs"
on "public"."moderation_logs"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Service role manages deletion requests"
on "public"."user_deletion_requests"
as permissive
for all
to public
using ((auth.role() = 'service_role'::text));


create policy "Users can view own deletion requests"
on "public"."user_deletion_requests"
as permissive
for select
to public
using (((auth.uid())::text = clerk_id));


create policy "Users can update own age data"
on "public"."users"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


CREATE TRIGGER update_controlnet_configs_updated_at BEFORE UPDATE ON public.controlnet_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_embedding_configs_updated_at BEFORE UPDATE ON public.embedding_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_image_jobs_updated_at BEFORE UPDATE ON public.image_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lora_configs_updated_at BEFORE UPDATE ON public.lora_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_moderation_logs_updated_at BEFORE UPDATE ON public.moderation_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


