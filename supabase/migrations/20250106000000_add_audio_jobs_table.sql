-- Create audio_jobs table for webhook-based audio generation
create table "public"."audio_jobs" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "job_id" text not null,
    "fal_request_id" text,
    "status" text not null default 'pending'::text,
    "type" text not null default 'document'::text, -- 'document' or 'text'
    "text" text,
    "voice" text,
    "source_audio_url" text, -- for voice cloning
    "high_quality_audio" boolean default true,
    "exaggeration" numeric,
    "cfg" numeric,
    "temperature" numeric,
    "seed" integer,
    "audio_url" text,
    "error" text,
    "progress" integer default 0,
    "cost" integer,
    "metadata" jsonb default '{}',
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "completed_at" timestamp with time zone,
    constraint "audio_jobs_pkey" primary key ("id"),
    constraint "audio_jobs_user_id_fkey" foreign key ("user_id") references "public"."users"("id") on delete cascade
);

-- Create indexes
create index "audio_jobs_user_id_idx" on "public"."audio_jobs" using btree ("user_id");
create index "audio_jobs_job_id_idx" on "public"."audio_jobs" using btree ("job_id");
create index "audio_jobs_fal_request_id_idx" on "public"."audio_jobs" using btree ("fal_request_id");
create index "audio_jobs_status_idx" on "public"."audio_jobs" using btree ("status");

-- Enable RLS
alter table "public"."audio_jobs" enable row level security;

-- Create RLS policies
create policy "Users can view their own audio jobs"
on "public"."audio_jobs"
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create their own audio jobs"
on "public"."audio_jobs"
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Users can update their own audio jobs"
on "public"."audio_jobs"
for update
to authenticated
using (user_id = auth.uid());

-- Create function to update updated_at timestamp
create or replace function update_audio_jobs_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger update_audio_jobs_updated_at
before update on "public"."audio_jobs"
for each row
execute function update_audio_jobs_updated_at();