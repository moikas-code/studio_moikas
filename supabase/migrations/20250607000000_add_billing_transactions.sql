-- Create billing_transactions table for tracking pre-charges and adjustments
create table if not exists billing_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  session_id uuid not null references workflow_sessions(id) on delete cascade,
  pre_charge_amount numeric not null default 0,
  actual_charge_amount numeric,
  adjustment_amount numeric,
  status text not null default 'pending' check (status in ('pending', 'completed', 'adjusted', 'refunded')),
  token_usage jsonb,
  created_at timestamp with time zone default now(),
  completed_at timestamp with time zone
);

-- Add indexes for performance
create index idx_billing_transactions_user_id on billing_transactions(user_id);
create index idx_billing_transactions_session_id on billing_transactions(session_id);
create index idx_billing_transactions_status on billing_transactions(status);
create index idx_billing_transactions_created_at on billing_transactions(created_at);

-- Enable RLS
alter table billing_transactions enable row level security;

-- Create policies for billing_transactions
create policy "Users can view their own billing transactions"
  on "public"."billing_transactions"
  for select
  using (user_id = get_user_id_from_clerk());

create policy "Users can create billing transactions"
  on "public"."billing_transactions"
  for insert
  with check (user_id = get_user_id_from_clerk());

create policy "Users can update their own billing transactions"
  on "public"."billing_transactions"
  for update
  using (user_id = get_user_id_from_clerk());

-- Grant necessary permissions
grant usage on schema public to authenticated;
grant select, insert, update on billing_transactions to authenticated;