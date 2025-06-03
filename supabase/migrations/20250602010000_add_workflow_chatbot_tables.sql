-- Create workflow templates table
create table "public"."workflow_templates" (
  "id" uuid not null default gen_random_uuid(),
  "name" text not null,
  "description" text,
  "category" text,
  "is_public" boolean default true,
  "created_by" uuid references users(id) on delete set null,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "workflow_templates_pkey" primary key ("id")
);

-- Create workflows table
create table "public"."workflows" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null references users(id) on delete cascade,
  "template_id" uuid references workflow_templates(id) on delete set null,
  "name" text not null,
  "description" text,
  "graph_data" jsonb not null default '{}',
  "settings" jsonb default '{}',
  "is_active" boolean default true,
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "workflows_pkey" primary key ("id")
);

-- Create workflow sessions table
create table "public"."workflow_sessions" (
  "id" uuid not null default gen_random_uuid(),
  "user_id" uuid not null references users(id) on delete cascade,
  "workflow_id" uuid references workflows(id) on delete cascade,
  "name" text,
  "status" text default 'active', -- 'active', 'completed', 'failed'
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  "metadata" jsonb default '{}',
  constraint "workflow_sessions_pkey" primary key ("id")
);

-- Create workflow messages table
create table "public"."workflow_messages" (
  "id" uuid not null default gen_random_uuid(),
  "session_id" uuid not null references workflow_sessions(id) on delete cascade,
  "role" text not null check (role in ('user', 'assistant', 'system', 'tool')),
  "content" text not null,
  "node_id" text, -- Track which node generated this message
  "tool_calls" jsonb, -- Store tool calls and responses
  "created_at" timestamp with time zone not null default now(),
  "metadata" jsonb default '{}',
  constraint "workflow_messages_pkey" primary key ("id")
);

-- Create workflow nodes table (for node definitions)
create table "public"."workflow_nodes" (
  "id" uuid not null default gen_random_uuid(),
  "workflow_id" uuid not null references workflows(id) on delete cascade,
  "node_id" text not null, -- Unique ID within the workflow
  "type" text not null, -- 'input', 'output', 'llm', 'image_generator', 'text_analyzer', etc.
  "position" jsonb not null default '{"x": 0, "y": 0}',
  "data" jsonb not null default '{}', -- Node-specific configuration
  "connections" jsonb default '[]', -- Array of connection objects
  "created_at" timestamp with time zone not null default now(),
  "updated_at" timestamp with time zone not null default now(),
  constraint "workflow_nodes_pkey" primary key ("id"),
  constraint "workflow_nodes_unique" unique ("workflow_id", "node_id")
);

-- Create workflow executions table (track runs)
create table "public"."workflow_executions" (
  "id" uuid not null default gen_random_uuid(),
  "session_id" uuid not null references workflow_sessions(id) on delete cascade,
  "workflow_id" uuid not null references workflows(id) on delete cascade,
  "status" text not null default 'pending', -- 'pending', 'running', 'completed', 'failed'
  "input_data" jsonb,
  "output_data" jsonb,
  "execution_path" jsonb, -- Track which nodes were executed
  "token_cost" integer default 0,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "error" text,
  "created_at" timestamp with time zone not null default now(),
  constraint "workflow_executions_pkey" primary key ("id")
);

-- Create indexes for performance
create index "idx_workflows_user_id" on "public"."workflows" ("user_id");
create index "idx_workflow_sessions_user_id" on "public"."workflow_sessions" ("user_id");
create index "idx_workflow_sessions_workflow_id" on "public"."workflow_sessions" ("workflow_id");
create index "idx_workflow_messages_session_id" on "public"."workflow_messages" ("session_id");
create index "idx_workflow_nodes_workflow_id" on "public"."workflow_nodes" ("workflow_id");
create index "idx_workflow_executions_session_id" on "public"."workflow_executions" ("session_id");
create index "idx_workflow_templates_category" on "public"."workflow_templates" ("category");

-- Enable RLS
alter table "public"."workflow_templates" enable row level security;
alter table "public"."workflows" enable row level security;
alter table "public"."workflow_sessions" enable row level security;
alter table "public"."workflow_messages" enable row level security;
alter table "public"."workflow_nodes" enable row level security;
alter table "public"."workflow_executions" enable row level security;

-- RLS policies for workflow_templates
create policy "Public templates are viewable by everyone"
  on "public"."workflow_templates"
  for select
  using (is_public = true);

create policy "Users can view their own templates"
  on "public"."workflow_templates"
  for select
  using (auth.uid() = created_by);

create policy "Users can create templates"
  on "public"."workflow_templates"
  for insert
  with check (auth.uid() = created_by);

create policy "Users can update their own templates"
  on "public"."workflow_templates"
  for update
  using (auth.uid() = created_by);

create policy "Users can delete their own templates"
  on "public"."workflow_templates"
  for delete
  using (auth.uid() = created_by);

-- RLS policies for workflows
create policy "Users can view their own workflows"
  on "public"."workflows"
  for select
  using (auth.uid() = user_id);

create policy "Users can create workflows"
  on "public"."workflows"
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own workflows"
  on "public"."workflows"
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own workflows"
  on "public"."workflows"
  for delete
  using (auth.uid() = user_id);

-- RLS policies for workflow_sessions
create policy "Users can view their own sessions"
  on "public"."workflow_sessions"
  for select
  using (auth.uid() = user_id);

create policy "Users can create sessions"
  on "public"."workflow_sessions"
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions"
  on "public"."workflow_sessions"
  for update
  using (auth.uid() = user_id);

-- RLS policies for workflow_messages
create policy "Users can view messages from their sessions"
  on "public"."workflow_messages"
  for select
  using (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_messages.session_id
      and workflow_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their sessions"
  on "public"."workflow_messages"
  for insert
  with check (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_messages.session_id
      and workflow_sessions.user_id = auth.uid()
    )
  );

-- RLS policies for workflow_nodes
create policy "Users can view nodes from their workflows"
  on "public"."workflow_nodes"
  for select
  using (
    exists (
      select 1 from workflows
      where workflows.id = workflow_nodes.workflow_id
      and workflows.user_id = auth.uid()
    )
  );

create policy "Users can manage nodes in their workflows"
  on "public"."workflow_nodes"
  for all
  using (
    exists (
      select 1 from workflows
      where workflows.id = workflow_nodes.workflow_id
      and workflows.user_id = auth.uid()
    )
  );

-- RLS policies for workflow_executions
create policy "Users can view executions from their sessions"
  on "public"."workflow_executions"
  for select
  using (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_executions.session_id
      and workflow_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create executions in their sessions"
  on "public"."workflow_executions"
  for insert
  with check (
    exists (
      select 1 from workflow_sessions
      where workflow_sessions.id = workflow_executions.session_id
      and workflow_sessions.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger update_workflow_templates_updated_at before update on workflow_templates
  for each row execute function update_updated_at_column();

create trigger update_workflows_updated_at before update on workflows
  for each row execute function update_updated_at_column();

create trigger update_workflow_sessions_updated_at before update on workflow_sessions
  for each row execute function update_updated_at_column();

create trigger update_workflow_nodes_updated_at before update on workflow_nodes
  for each row execute function update_updated_at_column();