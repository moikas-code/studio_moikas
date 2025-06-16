create table "public"."video_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "job_id" text not null,
    "status" text not null default 'pending'::text,
    "prompt" text,
    "negative_prompt" text,
    "model_id" text,
    "aspect" text,
    "duration" integer,
    "image_url" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "video_url" text,
    "error_message" text
);


alter table "public"."video_jobs" enable row level security;

CREATE UNIQUE INDEX video_jobs_pkey ON public.video_jobs USING btree (id);

CREATE INDEX video_jobs_user_id_idx ON public.video_jobs USING btree (user_id);

alter table "public"."video_jobs" add constraint "video_jobs_pkey" PRIMARY KEY using index "video_jobs_pkey";

alter table "public"."video_jobs" add constraint "video_jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE not valid;

alter table "public"."video_jobs" validate constraint "video_jobs_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.requesting_user_id()
 RETURNS text
 LANGUAGE sql
 STABLE
AS $function$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
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

grant delete on table "public"."video_jobs" to "anon";

grant insert on table "public"."video_jobs" to "anon";

grant references on table "public"."video_jobs" to "anon";

grant select on table "public"."video_jobs" to "anon";

grant trigger on table "public"."video_jobs" to "anon";

grant truncate on table "public"."video_jobs" to "anon";

grant update on table "public"."video_jobs" to "anon";

grant delete on table "public"."video_jobs" to "authenticated";

grant insert on table "public"."video_jobs" to "authenticated";

grant references on table "public"."video_jobs" to "authenticated";

grant select on table "public"."video_jobs" to "authenticated";

grant trigger on table "public"."video_jobs" to "authenticated";

grant truncate on table "public"."video_jobs" to "authenticated";

grant update on table "public"."video_jobs" to "authenticated";

grant delete on table "public"."video_jobs" to "service_role";

grant insert on table "public"."video_jobs" to "service_role";

grant references on table "public"."video_jobs" to "service_role";

grant select on table "public"."video_jobs" to "service_role";

grant trigger on table "public"."video_jobs" to "service_role";

grant truncate on table "public"."video_jobs" to "service_role";

grant update on table "public"."video_jobs" to "service_role";

create policy "Users can insert their own video jobs"
on "public"."video_jobs"
as permissive
for insert
to authenticated
with check ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = video_jobs.user_id) AND (users.clerk_id = requesting_user_id())))));


create policy "Users can view their own video jobs"
on "public"."video_jobs"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM users
  WHERE ((users.id = video_jobs.user_id) AND (users.clerk_id = requesting_user_id())))));



