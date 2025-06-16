-- Fix RLS policies to use clerk_id properly
-- First, create a function to get user_id from clerk_id
create or replace function get_user_id_from_clerk()
returns uuid
language sql
stable
as $$
  select id from users where clerk_id = (current_setting('request.jwt.claims', true)::json->>'sub')::text;
$$;

-- Drop existing policies for workflows
drop policy if exists "Users can view their own workflows" on "public"."workflows";
drop policy if exists "Users can create workflows" on "public"."workflows";
drop policy if exists "Users can update their own workflows" on "public"."workflows";
drop policy if exists "Users can delete their own workflows" on "public"."workflows";

-- Recreate policies using the correct user_id lookup
create policy "Users can view their own workflows"
  on "public"."workflows"
  for select
  using (user_id = get_user_id_from_clerk());

create policy "Users can create workflows"
  on "public"."workflows"
  for insert
  with check (user_id = get_user_id_from_clerk());

create policy "Users can update their own workflows"
  on "public"."workflows"
  for update
  using (user_id = get_user_id_from_clerk());

create policy "Users can delete their own workflows"
  on "public"."workflows"
  for delete
  using (user_id = get_user_id_from_clerk());

-- Drop existing policies for workflow_sessions
drop policy if exists "Users can view their own sessions" on "public"."workflow_sessions";
drop policy if exists "Users can create sessions" on "public"."workflow_sessions";
drop policy if exists "Users can update their own sessions" on "public"."workflow_sessions";

-- Recreate policies for workflow_sessions
create policy "Users can view their own sessions"
  on "public"."workflow_sessions"
  for select
  using (user_id = get_user_id_from_clerk());

create policy "Users can create sessions"
  on "public"."workflow_sessions"
  for insert
  with check (user_id = get_user_id_from_clerk());

create policy "Users can update their own sessions"
  on "public"."workflow_sessions"
  for update
  using (user_id = get_user_id_from_clerk());

-- Drop existing policies for workflow_messages
drop policy if exists "Users can view messages from their sessions" on "public"."workflow_messages";
drop policy if exists "Users can create messages in their sessions" on "public"."workflow_messages";

-- Recreate policies for workflow_messages
create policy "Users can view messages from their sessions"
  on "public"."workflow_messages"
  for select
  using (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_messages.session_id
      and workflow_sessions.user_id = get_user_id_from_clerk()
    )
  );

create policy "Users can create messages in their sessions"
  on "public"."workflow_messages"
  for insert
  with check (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_messages.session_id
      and workflow_sessions.user_id = get_user_id_from_clerk()
    )
  );

-- Drop existing policies for workflow_nodes
drop policy if exists "Users can view nodes from their workflows" on "public"."workflow_nodes";
drop policy if exists "Users can manage nodes in their workflows" on "public"."workflow_nodes";

-- Recreate policies for workflow_nodes
create policy "Users can view nodes from their workflows"
  on "public"."workflow_nodes"
  for select
  using (
    exists (
      select 1 from workflows
      where workflows.id = workflow_nodes.workflow_id
      and workflows.user_id = get_user_id_from_clerk()
    )
  );

create policy "Users can manage nodes in their workflows"
  on "public"."workflow_nodes"
  for all
  using (
    exists (
      select 1 from workflows
      where workflows.id = workflow_nodes.workflow_id
      and workflows.user_id = get_user_id_from_clerk()
    )
  );

-- Drop existing policies for workflow_executions
drop policy if exists "Users can view executions from their sessions" on "public"."workflow_executions";
drop policy if exists "Users can create executions in their sessions" on "public"."workflow_executions";

-- Recreate policies for workflow_executions
create policy "Users can view executions from their sessions"
  on "public"."workflow_executions"
  for select
  using (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_executions.session_id
      and workflow_sessions.user_id = get_user_id_from_clerk()
    )
  );

create policy "Users can create executions in their sessions"
  on "public"."workflow_executions"
  for insert
  with check (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_executions.session_id
      and workflow_sessions.user_id = get_user_id_from_clerk()
    )
  );

-- Update the existing deduct_tokens function to handle renewable and permanent tokens separately
create or replace function deduct_tokens(
  p_user_id uuid,
  p_renewable_tokens numeric,
  p_permanent_tokens numeric
)
returns void
language plpgsql
security definer
as $$
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
$$;

-- Add RLS policies for user_chat_defaults table (created in earlier migration)
create policy "Users can view their own chat defaults"
  on "public"."user_chat_defaults"
  for select
  using (user_id = get_user_id_from_clerk());

create policy "Users can create their own chat defaults"
  on "public"."user_chat_defaults"
  for insert
  with check (user_id = get_user_id_from_clerk());

create policy "Users can update their own chat defaults"
  on "public"."user_chat_defaults"
  for update
  using (user_id = get_user_id_from_clerk());

create policy "Users can delete their own chat defaults"
  on "public"."user_chat_defaults"
  for delete
  using (user_id = get_user_id_from_clerk());

-- Grant necessary permissions
grant execute on function get_user_id_from_clerk() to authenticated;
grant execute on function deduct_tokens(uuid, numeric, numeric) to authenticated;