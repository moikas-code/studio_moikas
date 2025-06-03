-- Create user_chat_defaults table to store customizable default chat settings
create table "public"."user_chat_defaults" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null references users(id) on delete cascade,
  "system_prompt" text default 'You are a helpful AI assistant.',
  "response_style" text default 'conversational' check (response_style in ('conversational', 'formal', 'creative', 'technical', 'concise')),
  "temperature" numeric(3,2) default 0.7 check (temperature >= 0 and temperature <= 1),
  "max_tokens" integer default 2048 check (max_tokens > 0 and max_tokens <= 4096),
  "context_window" integer default 20 check (context_window > 0 and context_window <= 50),
  "enable_memory" boolean default true,
  "enable_web_search" boolean default false,
  "enable_code_execution" boolean default false,
  "custom_instructions" text,
  "model_preference" text default 'grok-3-mini-latest',
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "user_chat_defaults_pkey" primary key ("id"),
  constraint "user_chat_defaults_user_unique" unique ("user_id")
);

-- Create index for performance
create index "idx_user_chat_defaults_user_id" on "public"."user_chat_defaults" ("user_id");

-- Enable RLS
alter table "public"."user_chat_defaults" enable row level security;

-- RLS policies for user_chat_defaults will be created in later migration
-- For now, allow service role to manage this table

-- Create trigger for updated_at
create trigger update_user_chat_defaults_updated_at before update on user_chat_defaults
  for each row execute function update_updated_at_column();

-- Function to get or create default chat settings for a user
create or replace function get_or_create_user_chat_defaults(p_user_id uuid)
returns user_chat_defaults
language plpgsql
security definer
as $$
declare
  result user_chat_defaults;
begin
  -- Try to get existing defaults
  select * into result
  from user_chat_defaults
  where user_id = p_user_id;
  
  -- If not found, create with defaults
  if not found then
    insert into user_chat_defaults (user_id)
    values (p_user_id)
    returning * into result;
  end if;
  
  return result;
end;
$$;

-- Grant permissions
grant execute on function get_or_create_user_chat_defaults(uuid) to authenticated;