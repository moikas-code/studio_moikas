drop trigger if exists "update_controlnet_configs_updated_at" on "public"."controlnet_configs";

drop trigger if exists "update_embedding_configs_updated_at" on "public"."embedding_configs";

drop trigger if exists "update_image_jobs_updated_at" on "public"."image_jobs";

drop trigger if exists "update_lora_configs_updated_at" on "public"."lora_configs";

drop trigger if exists "update_moderation_logs_updated_at" on "public"."moderation_logs";

drop trigger if exists "audit_subscriptions_trigger" on "public"."subscriptions";

drop trigger if exists "audit_users_trigger" on "public"."users";

drop policy "Service role can manage audit logs" on "public"."audit_log";

drop policy "Admins can manage controlnet configs" on "public"."controlnet_configs";

drop policy "Public can view active controlnet configs" on "public"."controlnet_configs";

drop policy "Admins can view DMCA actions" on "public"."dmca_actions";

drop policy "Admins can update DMCA requests" on "public"."dmca_requests";

drop policy "Admins can view all DMCA requests" on "public"."dmca_requests";

drop policy "Anyone can submit DMCA requests" on "public"."dmca_requests";

drop policy "Complainants can view own requests" on "public"."dmca_requests";

drop policy "Admins can manage embedding configs" on "public"."embedding_configs";

drop policy "Public can view active embedding configs" on "public"."embedding_configs";

drop policy "Admin users can delete all image jobs" on "public"."image_jobs";

drop policy "Admin users can update all image jobs" on "public"."image_jobs";

drop policy "Admin users can view all image jobs" on "public"."image_jobs";

drop policy "Service role can manage all image jobs" on "public"."image_jobs";

drop policy "Users can create own image jobs" on "public"."image_jobs";

drop policy "Users can update own image jobs" on "public"."image_jobs";

drop policy "Users can view own image jobs" on "public"."image_jobs";

drop policy "Admins can manage LoRA configs" on "public"."lora_configs";

drop policy "Public can view active LoRA configs" on "public"."lora_configs";

drop policy "Admins can view all moderation logs" on "public"."moderation_logs";

drop policy "Users can report false positives" on "public"."moderation_logs";

drop policy "Users can view own moderation logs" on "public"."moderation_logs";

drop policy "Users can view their own rate limits" on "public"."rate_limits";

drop policy "Service role can insert usage records" on "public"."usage";

drop policy "Users can view their own usage" on "public"."usage";

drop policy "Service role manages deletion requests" on "public"."user_deletion_requests";

drop policy "Users can view own deletion requests" on "public"."user_deletion_requests";

drop policy "Users can update own age data" on "public"."users";

drop policy "Service role can read video jobs for webhooks" on "public"."video_jobs";

drop policy "Service role can update video job status" on "public"."video_jobs";

revoke delete on table "public"."audit_log" from "anon";

revoke insert on table "public"."audit_log" from "anon";

revoke references on table "public"."audit_log" from "anon";

revoke select on table "public"."audit_log" from "anon";

revoke trigger on table "public"."audit_log" from "anon";

revoke truncate on table "public"."audit_log" from "anon";

revoke update on table "public"."audit_log" from "anon";

revoke delete on table "public"."audit_log" from "authenticated";

revoke insert on table "public"."audit_log" from "authenticated";

revoke references on table "public"."audit_log" from "authenticated";

revoke select on table "public"."audit_log" from "authenticated";

revoke trigger on table "public"."audit_log" from "authenticated";

revoke truncate on table "public"."audit_log" from "authenticated";

revoke update on table "public"."audit_log" from "authenticated";

revoke delete on table "public"."audit_log" from "service_role";

revoke insert on table "public"."audit_log" from "service_role";

revoke references on table "public"."audit_log" from "service_role";

revoke select on table "public"."audit_log" from "service_role";

revoke trigger on table "public"."audit_log" from "service_role";

revoke truncate on table "public"."audit_log" from "service_role";

revoke update on table "public"."audit_log" from "service_role";

revoke delete on table "public"."controlnet_configs" from "anon";

revoke insert on table "public"."controlnet_configs" from "anon";

revoke references on table "public"."controlnet_configs" from "anon";

revoke select on table "public"."controlnet_configs" from "anon";

revoke trigger on table "public"."controlnet_configs" from "anon";

revoke truncate on table "public"."controlnet_configs" from "anon";

revoke update on table "public"."controlnet_configs" from "anon";

revoke delete on table "public"."controlnet_configs" from "authenticated";

revoke insert on table "public"."controlnet_configs" from "authenticated";

revoke references on table "public"."controlnet_configs" from "authenticated";

revoke select on table "public"."controlnet_configs" from "authenticated";

revoke trigger on table "public"."controlnet_configs" from "authenticated";

revoke truncate on table "public"."controlnet_configs" from "authenticated";

revoke update on table "public"."controlnet_configs" from "authenticated";

revoke delete on table "public"."controlnet_configs" from "service_role";

revoke insert on table "public"."controlnet_configs" from "service_role";

revoke references on table "public"."controlnet_configs" from "service_role";

revoke select on table "public"."controlnet_configs" from "service_role";

revoke trigger on table "public"."controlnet_configs" from "service_role";

revoke truncate on table "public"."controlnet_configs" from "service_role";

revoke update on table "public"."controlnet_configs" from "service_role";

revoke delete on table "public"."dmca_actions" from "anon";

revoke insert on table "public"."dmca_actions" from "anon";

revoke references on table "public"."dmca_actions" from "anon";

revoke select on table "public"."dmca_actions" from "anon";

revoke trigger on table "public"."dmca_actions" from "anon";

revoke truncate on table "public"."dmca_actions" from "anon";

revoke update on table "public"."dmca_actions" from "anon";

revoke delete on table "public"."dmca_actions" from "authenticated";

revoke insert on table "public"."dmca_actions" from "authenticated";

revoke references on table "public"."dmca_actions" from "authenticated";

revoke select on table "public"."dmca_actions" from "authenticated";

revoke trigger on table "public"."dmca_actions" from "authenticated";

revoke truncate on table "public"."dmca_actions" from "authenticated";

revoke update on table "public"."dmca_actions" from "authenticated";

revoke delete on table "public"."dmca_actions" from "service_role";

revoke insert on table "public"."dmca_actions" from "service_role";

revoke references on table "public"."dmca_actions" from "service_role";

revoke select on table "public"."dmca_actions" from "service_role";

revoke trigger on table "public"."dmca_actions" from "service_role";

revoke truncate on table "public"."dmca_actions" from "service_role";

revoke update on table "public"."dmca_actions" from "service_role";

revoke delete on table "public"."dmca_requests" from "anon";

revoke insert on table "public"."dmca_requests" from "anon";

revoke references on table "public"."dmca_requests" from "anon";

revoke select on table "public"."dmca_requests" from "anon";

revoke trigger on table "public"."dmca_requests" from "anon";

revoke truncate on table "public"."dmca_requests" from "anon";

revoke update on table "public"."dmca_requests" from "anon";

revoke delete on table "public"."dmca_requests" from "authenticated";

revoke insert on table "public"."dmca_requests" from "authenticated";

revoke references on table "public"."dmca_requests" from "authenticated";

revoke select on table "public"."dmca_requests" from "authenticated";

revoke trigger on table "public"."dmca_requests" from "authenticated";

revoke truncate on table "public"."dmca_requests" from "authenticated";

revoke update on table "public"."dmca_requests" from "authenticated";

revoke delete on table "public"."dmca_requests" from "service_role";

revoke insert on table "public"."dmca_requests" from "service_role";

revoke references on table "public"."dmca_requests" from "service_role";

revoke select on table "public"."dmca_requests" from "service_role";

revoke trigger on table "public"."dmca_requests" from "service_role";

revoke truncate on table "public"."dmca_requests" from "service_role";

revoke update on table "public"."dmca_requests" from "service_role";

revoke delete on table "public"."embedding_configs" from "anon";

revoke insert on table "public"."embedding_configs" from "anon";

revoke references on table "public"."embedding_configs" from "anon";

revoke select on table "public"."embedding_configs" from "anon";

revoke trigger on table "public"."embedding_configs" from "anon";

revoke truncate on table "public"."embedding_configs" from "anon";

revoke update on table "public"."embedding_configs" from "anon";

revoke delete on table "public"."embedding_configs" from "authenticated";

revoke insert on table "public"."embedding_configs" from "authenticated";

revoke references on table "public"."embedding_configs" from "authenticated";

revoke select on table "public"."embedding_configs" from "authenticated";

revoke trigger on table "public"."embedding_configs" from "authenticated";

revoke truncate on table "public"."embedding_configs" from "authenticated";

revoke update on table "public"."embedding_configs" from "authenticated";

revoke delete on table "public"."embedding_configs" from "service_role";

revoke insert on table "public"."embedding_configs" from "service_role";

revoke references on table "public"."embedding_configs" from "service_role";

revoke select on table "public"."embedding_configs" from "service_role";

revoke trigger on table "public"."embedding_configs" from "service_role";

revoke truncate on table "public"."embedding_configs" from "service_role";

revoke update on table "public"."embedding_configs" from "service_role";

revoke delete on table "public"."image_jobs" from "anon";

revoke insert on table "public"."image_jobs" from "anon";

revoke references on table "public"."image_jobs" from "anon";

revoke select on table "public"."image_jobs" from "anon";

revoke trigger on table "public"."image_jobs" from "anon";

revoke truncate on table "public"."image_jobs" from "anon";

revoke update on table "public"."image_jobs" from "anon";

revoke delete on table "public"."image_jobs" from "authenticated";

revoke insert on table "public"."image_jobs" from "authenticated";

revoke references on table "public"."image_jobs" from "authenticated";

revoke select on table "public"."image_jobs" from "authenticated";

revoke trigger on table "public"."image_jobs" from "authenticated";

revoke truncate on table "public"."image_jobs" from "authenticated";

revoke update on table "public"."image_jobs" from "authenticated";

revoke delete on table "public"."image_jobs" from "service_role";

revoke insert on table "public"."image_jobs" from "service_role";

revoke references on table "public"."image_jobs" from "service_role";

revoke select on table "public"."image_jobs" from "service_role";

revoke trigger on table "public"."image_jobs" from "service_role";

revoke truncate on table "public"."image_jobs" from "service_role";

revoke update on table "public"."image_jobs" from "service_role";

revoke delete on table "public"."lora_configs" from "anon";

revoke insert on table "public"."lora_configs" from "anon";

revoke references on table "public"."lora_configs" from "anon";

revoke select on table "public"."lora_configs" from "anon";

revoke trigger on table "public"."lora_configs" from "anon";

revoke truncate on table "public"."lora_configs" from "anon";

revoke update on table "public"."lora_configs" from "anon";

revoke delete on table "public"."lora_configs" from "authenticated";

revoke insert on table "public"."lora_configs" from "authenticated";

revoke references on table "public"."lora_configs" from "authenticated";

revoke select on table "public"."lora_configs" from "authenticated";

revoke trigger on table "public"."lora_configs" from "authenticated";

revoke truncate on table "public"."lora_configs" from "authenticated";

revoke update on table "public"."lora_configs" from "authenticated";

revoke delete on table "public"."lora_configs" from "service_role";

revoke insert on table "public"."lora_configs" from "service_role";

revoke references on table "public"."lora_configs" from "service_role";

revoke select on table "public"."lora_configs" from "service_role";

revoke trigger on table "public"."lora_configs" from "service_role";

revoke truncate on table "public"."lora_configs" from "service_role";

revoke update on table "public"."lora_configs" from "service_role";

revoke delete on table "public"."moderation_logs" from "anon";

revoke insert on table "public"."moderation_logs" from "anon";

revoke references on table "public"."moderation_logs" from "anon";

revoke select on table "public"."moderation_logs" from "anon";

revoke trigger on table "public"."moderation_logs" from "anon";

revoke truncate on table "public"."moderation_logs" from "anon";

revoke update on table "public"."moderation_logs" from "anon";

revoke delete on table "public"."moderation_logs" from "authenticated";

revoke insert on table "public"."moderation_logs" from "authenticated";

revoke references on table "public"."moderation_logs" from "authenticated";

revoke select on table "public"."moderation_logs" from "authenticated";

revoke trigger on table "public"."moderation_logs" from "authenticated";

revoke truncate on table "public"."moderation_logs" from "authenticated";

revoke update on table "public"."moderation_logs" from "authenticated";

revoke delete on table "public"."moderation_logs" from "service_role";

revoke insert on table "public"."moderation_logs" from "service_role";

revoke references on table "public"."moderation_logs" from "service_role";

revoke select on table "public"."moderation_logs" from "service_role";

revoke trigger on table "public"."moderation_logs" from "service_role";

revoke truncate on table "public"."moderation_logs" from "service_role";

revoke update on table "public"."moderation_logs" from "service_role";

revoke delete on table "public"."rate_limits" from "anon";

revoke insert on table "public"."rate_limits" from "anon";

revoke references on table "public"."rate_limits" from "anon";

revoke select on table "public"."rate_limits" from "anon";

revoke trigger on table "public"."rate_limits" from "anon";

revoke truncate on table "public"."rate_limits" from "anon";

revoke update on table "public"."rate_limits" from "anon";

revoke delete on table "public"."rate_limits" from "authenticated";

revoke insert on table "public"."rate_limits" from "authenticated";

revoke references on table "public"."rate_limits" from "authenticated";

revoke select on table "public"."rate_limits" from "authenticated";

revoke trigger on table "public"."rate_limits" from "authenticated";

revoke truncate on table "public"."rate_limits" from "authenticated";

revoke update on table "public"."rate_limits" from "authenticated";

revoke delete on table "public"."rate_limits" from "service_role";

revoke insert on table "public"."rate_limits" from "service_role";

revoke references on table "public"."rate_limits" from "service_role";

revoke select on table "public"."rate_limits" from "service_role";

revoke trigger on table "public"."rate_limits" from "service_role";

revoke truncate on table "public"."rate_limits" from "service_role";

revoke update on table "public"."rate_limits" from "service_role";

revoke delete on table "public"."system_logs" from "anon";

revoke insert on table "public"."system_logs" from "anon";

revoke references on table "public"."system_logs" from "anon";

revoke select on table "public"."system_logs" from "anon";

revoke trigger on table "public"."system_logs" from "anon";

revoke truncate on table "public"."system_logs" from "anon";

revoke update on table "public"."system_logs" from "anon";

revoke delete on table "public"."system_logs" from "authenticated";

revoke insert on table "public"."system_logs" from "authenticated";

revoke references on table "public"."system_logs" from "authenticated";

revoke select on table "public"."system_logs" from "authenticated";

revoke trigger on table "public"."system_logs" from "authenticated";

revoke truncate on table "public"."system_logs" from "authenticated";

revoke update on table "public"."system_logs" from "authenticated";

revoke delete on table "public"."system_logs" from "service_role";

revoke insert on table "public"."system_logs" from "service_role";

revoke references on table "public"."system_logs" from "service_role";

revoke select on table "public"."system_logs" from "service_role";

revoke trigger on table "public"."system_logs" from "service_role";

revoke truncate on table "public"."system_logs" from "service_role";

revoke update on table "public"."system_logs" from "service_role";

revoke delete on table "public"."user_deletion_requests" from "anon";

revoke insert on table "public"."user_deletion_requests" from "anon";

revoke references on table "public"."user_deletion_requests" from "anon";

revoke select on table "public"."user_deletion_requests" from "anon";

revoke trigger on table "public"."user_deletion_requests" from "anon";

revoke truncate on table "public"."user_deletion_requests" from "anon";

revoke update on table "public"."user_deletion_requests" from "anon";

revoke delete on table "public"."user_deletion_requests" from "authenticated";

revoke insert on table "public"."user_deletion_requests" from "authenticated";

revoke references on table "public"."user_deletion_requests" from "authenticated";

revoke select on table "public"."user_deletion_requests" from "authenticated";

revoke trigger on table "public"."user_deletion_requests" from "authenticated";

revoke truncate on table "public"."user_deletion_requests" from "authenticated";

revoke update on table "public"."user_deletion_requests" from "authenticated";

revoke delete on table "public"."user_deletion_requests" from "service_role";

revoke insert on table "public"."user_deletion_requests" from "service_role";

revoke references on table "public"."user_deletion_requests" from "service_role";

revoke select on table "public"."user_deletion_requests" from "service_role";

revoke trigger on table "public"."user_deletion_requests" from "service_role";

revoke truncate on table "public"."user_deletion_requests" from "service_role";

revoke update on table "public"."user_deletion_requests" from "service_role";

alter table "public"."controlnet_configs" drop constraint "controlnet_configs_conditioning_scale_check";

alter table "public"."controlnet_configs" drop constraint "controlnet_configs_created_by_fkey";

alter table "public"."dmca_actions" drop constraint "dmca_actions_dmca_request_id_fkey";

alter table "public"."dmca_requests" drop constraint "dmca_requests_reported_user_id_fkey";

alter table "public"."dmca_requests" drop constraint "dmca_requests_status_check";

alter table "public"."embedding_configs" drop constraint "embedding_configs_created_by_fkey";

alter table "public"."image_jobs" drop constraint "image_jobs_fal_request_id_key";

alter table "public"."image_jobs" drop constraint "image_jobs_job_id_key";

alter table "public"."image_jobs" drop constraint "image_jobs_progress_check";

alter table "public"."image_jobs" drop constraint "image_jobs_status_check";

alter table "public"."image_jobs" drop constraint "image_jobs_user_id_fkey";

alter table "public"."lora_configs" drop constraint "lora_configs_created_by_fkey";

alter table "public"."lora_configs" drop constraint "lora_configs_scale_check";

alter table "public"."moderation_logs" drop constraint "moderation_logs_confidence_check";

alter table "public"."moderation_logs" drop constraint "moderation_logs_user_id_fkey";

alter table "public"."rate_limits" drop constraint "rate_limits_user_id_fkey";

alter table "public"."rate_limits" drop constraint "rate_limits_user_id_operation_window_start_key";

alter table "public"."user_deletion_requests" drop constraint "user_deletion_requests_status_check";

alter table "public"."user_deletion_requests" drop constraint "user_deletion_requests_user_id_fkey";

alter table "public"."user_deletion_requests" drop constraint "user_deletion_requests_user_id_status_key";

drop function if exists "public"."check_rate_limit"(p_user_id uuid, p_operation text, p_max_per_hour integer);

drop function if exists "public"."check_user_age"(birth_date date, region character varying);

drop function if exists "public"."delete_old_image_jobs"();

drop function if exists "public"."delete_old_prompts"();

drop function if exists "public"."get_moderation_stats"(start_date timestamp with time zone, end_date timestamp with time zone);

drop function if exists "public"."log_dmca_action"(request_id uuid, action_type text, performed_by_user text, action_details jsonb);

drop function if exists "public"."log_moderation_decision"(p_user_id uuid, p_prompt text, p_safe boolean, p_violations text[], p_confidence numeric);

drop function if exists "public"."log_sensitive_operations"();

drop function if exists "public"."process_dmca_takedown"(request_id uuid, admin_id text);

drop function if exists "public"."process_user_deletions"();

drop function if exists "public"."verify_user_age"(user_id uuid, birth_date date, region character varying);

drop view if exists "public"."admin_active_models";

drop view if exists "public"."admin_user_stats";

alter table "public"."audit_log" drop constraint "audit_log_pkey";

alter table "public"."controlnet_configs" drop constraint "controlnet_configs_pkey";

alter table "public"."dmca_actions" drop constraint "dmca_actions_pkey";

alter table "public"."dmca_requests" drop constraint "dmca_requests_pkey";

alter table "public"."embedding_configs" drop constraint "embedding_configs_pkey";

alter table "public"."image_jobs" drop constraint "image_jobs_pkey";

alter table "public"."lora_configs" drop constraint "lora_configs_pkey";

alter table "public"."moderation_logs" drop constraint "moderation_logs_pkey";

alter table "public"."rate_limits" drop constraint "rate_limits_pkey";

alter table "public"."system_logs" drop constraint "system_logs_pkey";

alter table "public"."user_deletion_requests" drop constraint "user_deletion_requests_pkey";

drop index if exists "public"."audit_log_pkey";

drop index if exists "public"."controlnet_configs_pkey";

drop index if exists "public"."dmca_actions_pkey";

drop index if exists "public"."dmca_requests_pkey";

drop index if exists "public"."embedding_configs_pkey";

drop index if exists "public"."idx_controlnet_configs_is_active";

drop index if exists "public"."idx_controlnet_configs_name";

drop index if exists "public"."idx_controlnet_configs_type";

drop index if exists "public"."idx_deletion_requests_scheduled_date";

drop index if exists "public"."idx_deletion_requests_status";

drop index if exists "public"."idx_dmca_requests_created_at";

drop index if exists "public"."idx_dmca_requests_reported_user";

drop index if exists "public"."idx_dmca_requests_status";

drop index if exists "public"."idx_embedding_configs_created_by";

drop index if exists "public"."idx_embedding_configs_is_active";

drop index if exists "public"."idx_embedding_configs_name";

drop index if exists "public"."idx_image_jobs_created_at";

drop index if exists "public"."idx_image_jobs_fal_request_id";

drop index if exists "public"."idx_image_jobs_job_id";

drop index if exists "public"."idx_image_jobs_status";

drop index if exists "public"."idx_image_jobs_user_id";

drop index if exists "public"."idx_lora_configs_created_by";

drop index if exists "public"."idx_lora_configs_is_active";

drop index if exists "public"."idx_lora_configs_name";

drop index if exists "public"."idx_moderation_logs_created_at";

drop index if exists "public"."idx_moderation_logs_false_positive";

drop index if exists "public"."idx_moderation_logs_safe";

drop index if exists "public"."idx_moderation_logs_user_id";

drop index if exists "public"."idx_moderation_logs_violations";

drop index if exists "public"."idx_system_logs_action";

drop index if exists "public"."idx_system_logs_created_at";

drop index if exists "public"."idx_users_region";

drop index if exists "public"."image_jobs_fal_request_id_key";

drop index if exists "public"."image_jobs_job_id_key";

drop index if exists "public"."image_jobs_pkey";

drop index if exists "public"."lora_configs_pkey";

drop index if exists "public"."moderation_logs_pkey";

drop index if exists "public"."rate_limits_pkey";

drop index if exists "public"."rate_limits_user_id_operation_window_start_key";

drop index if exists "public"."system_logs_pkey";

drop index if exists "public"."user_deletion_requests_pkey";

drop index if exists "public"."user_deletion_requests_user_id_status_key";

drop table "public"."audit_log";

drop table "public"."controlnet_configs";

drop table "public"."dmca_actions";

drop table "public"."dmca_requests";

drop table "public"."embedding_configs";

drop table "public"."image_jobs";

drop table "public"."lora_configs";

drop table "public"."moderation_logs";

drop table "public"."rate_limits";

drop table "public"."system_logs";

drop table "public"."user_deletion_requests";

alter table "public"."models" drop column "billing_type";

alter table "public"."models" drop column "default_clip_skip";

alter table "public"."models" drop column "default_eta";

alter table "public"."models" drop column "default_prediction_type";

alter table "public"."models" drop column "default_scheduler";

alter table "public"."models" drop column "default_tile_height";

alter table "public"."models" drop column "default_tile_width";

alter table "public"."models" drop column "default_variant";

alter table "public"."models" drop column "has_safety_checker";

alter table "public"."models" drop column "max_clip_skip";

alter table "public"."models" drop column "max_eta";

alter table "public"."models" drop column "max_tile_height";

alter table "public"."models" drop column "max_tile_width";

alter table "public"."models" drop column "max_time_charge_seconds";

alter table "public"."models" drop column "min_cfg";

alter table "public"."models" drop column "min_time_charge_seconds";

alter table "public"."models" drop column "supported_prediction_types";

alter table "public"."models" drop column "supported_schedulers";

alter table "public"."models" drop column "supported_variants";

alter table "public"."models" drop column "supports_clip_skip";

alter table "public"."models" drop column "supports_controlnet";

alter table "public"."models" drop column "supports_custom_sigmas";

alter table "public"."models" drop column "supports_custom_timesteps";

alter table "public"."models" drop column "supports_embeddings";

alter table "public"."models" drop column "supports_eta";

alter table "public"."models" drop column "supports_ip_adapter";

alter table "public"."models" drop column "supports_loras";

alter table "public"."models" drop column "supports_prompt_weighting";

alter table "public"."models" drop column "supports_tile_size";

alter table "public"."subscriptions" drop column "created_at";

alter table "public"."subscriptions" drop column "pro_tokens_cap";

alter table "public"."subscriptions" drop column "pro_tokens_used";

alter table "public"."subscriptions" add column "premium_generations_used" integer default 0;

alter table "public"."users" drop column "age_verified_at";

alter table "public"."users" drop column "birth_date";

alter table "public"."users" drop column "region";

drop type "public"."billing_type";

alter table "public"."subscriptions" add constraint "premium_generations_cap" CHECK ((premium_generations_used <= 100)) not valid;

alter table "public"."subscriptions" validate constraint "premium_generations_cap";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id uuid, p_required_tokens numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  update subscriptions
  set tokens = tokens - p_required_tokens
  where user_id = p_user_id
    and tokens >= p_required_tokens;

  if not found then
    raise exception 'Insufficient tokens or user not found';
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.requesting_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_all_user_tokens()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE subscriptions
  SET renewable_tokens = 125,
      renewed_at = NOW()
  WHERE plan = 'free'
    AND (renewed_at IS NULL OR renewed_at < NOW() - INTERVAL '28 days');

  UPDATE subscriptions
  SET renewable_tokens = 4000,
      renewed_at = NOW()
  WHERE plan = 'standard'
    AND (renewed_at IS NULL OR renewed_at < NOW() - INTERVAL '28 days');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_free_user_tokens()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE subscriptions
  SET renewable_tokens = 125,
      renewed_at = NOW()
  WHERE plan = 'free'
    AND (renewed_at IS NULL OR renewed_at < NOW() - INTERVAL '28 days');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reset_premium_generations_on_renewal()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.renewed_at IS DISTINCT FROM OLD.renewed_at THEN
    NEW.premium_generations_used := 0;
  END IF;
  RETURN NEW;
END;
$function$
;

create or replace view "public"."admin_active_models" as  SELECT models.id,
    models.model_id,
    models.name,
    models.type,
    models.cost_per_mp,
    models.custom_cost,
    (models.custom_cost / 0.001) AS mp_cost,
    models.is_active,
    models.is_default,
    models.tags,
    models.display_order
   FROM models
  WHERE (models.is_active = true)
  ORDER BY models.display_order, models.name;


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


CREATE OR REPLACE FUNCTION public.deduct_tokens(p_user_id uuid, p_renewable_tokens numeric, p_permanent_tokens numeric)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  -- Update the subscription tokens
  update subscriptions
  set 
    renewable_tokens = greatest(0, renewable_tokens - p_renewable_tokens),
    permanent_tokens = greatest(0, permanent_tokens - p_permanent_tokens)
  where user_id = p_user_id;
  
  -- Check if the update succeeded
  if not found then
    raise exception 'User subscription not found';
  end if;
  
  -- Verify sufficient tokens were available
  if exists (
    select 1 from subscriptions 
    where user_id = p_user_id 
    and (renewable_tokens < 0 or permanent_tokens < 0)
  ) then
    raise exception 'Insufficient tokens';
  end if;
end;
$function$
;

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
        WHEN plan_type = 'free' THEN 125 
        WHEN plan_type = 'standard' THEN 20480
        ELSE renewable_tokens + p_amount
      END),
    permanent_tokens = permanent_tokens + GREATEST(0, 
      p_amount - (CASE 
        WHEN plan_type = 'free' THEN 125 - renewable_tokens
        WHEN plan_type = 'standard' THEN 20480 - renewable_tokens
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

CREATE OR REPLACE FUNCTION public.update_user_chat_defaults(p_user_id uuid, p_temperature numeric DEFAULT NULL::numeric, p_max_tokens integer DEFAULT NULL::integer, p_model text DEFAULT NULL::text, p_system_prompt text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    defaults_record RECORD;
    result JSONB;
BEGIN
    -- Update the defaults, only setting provided values
    UPDATE user_chat_defaults 
    SET 
        temperature = COALESCE(p_temperature, temperature),
        max_tokens = COALESCE(p_max_tokens, max_tokens),
        model = COALESCE(p_model, model),
        system_prompt = COALESCE(p_system_prompt, system_prompt),
        updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING * INTO defaults_record;
    
    -- If user doesn't exist, create with provided values and defaults
    IF NOT FOUND THEN
        INSERT INTO user_chat_defaults (
            user_id,
            temperature,
            max_tokens,
            model_preference,
            system_prompt,
            created_at,
            updated_at
        ) VALUES (
            p_user_id,
            COALESCE(p_temperature, 0.7),
            COALESCE(p_max_tokens, 2048),
            COALESCE(p_model, 'grok-2-mini-latest'),
            COALESCE(p_system_prompt, 'You are a helpful AI assistant.'),
            NOW(),
            NOW()
        )
        RETURNING * INTO defaults_record;
    END IF;
    
    -- Convert record to JSONB
    result := jsonb_build_object(
        'user_id', defaults_record.user_id,
        'temperature', defaults_record.temperature,
        'max_tokens', defaults_record.max_tokens,
        'model', defaults_record.model_preference,
        'system_prompt', defaults_record.system_prompt,
        'created_at', defaults_record.created_at,
        'updated_at', defaults_record.updated_at
    );
    
    RETURN result;
END;
$function$
;

grant delete on table "public"."subscriptions" to "anon";

grant insert on table "public"."subscriptions" to "anon";

grant update on table "public"."subscriptions" to "anon";

grant delete on table "public"."usage" to "anon";

grant insert on table "public"."usage" to "anon";

grant update on table "public"."usage" to "anon";

grant delete on table "public"."users" to "anon";

grant insert on table "public"."users" to "anon";

grant update on table "public"."users" to "anon";

grant delete on table "public"."video_jobs" to "anon";

grant insert on table "public"."video_jobs" to "anon";

grant update on table "public"."video_jobs" to "anon";

create policy "Users can insert their own subscriptions"
on "public"."subscriptions"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))));


create policy "Users can update their own subscriptions"
on "public"."subscriptions"
as permissive
for update
to authenticated
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))))
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))));


create policy "Users can view their own subscriptions"
on "public"."subscriptions"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = subscriptions.user_id) AND (users.clerk_id = requesting_user_id())))));


create policy "Users can insert their own data"
on "public"."users"
as permissive
for insert
to authenticated
with check ((requesting_user_id() = clerk_id));


create policy "Users can view their own data"
on "public"."users"
as permissive
for select
to authenticated
using ((requesting_user_id() = clerk_id));


create policy "Service role can do everything"
on "public"."video_jobs"
as permissive
for all
to service_role
using (true)
with check (true);


CREATE TRIGGER trigger_reset_premium_generations BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION reset_premium_generations_on_renewal();


