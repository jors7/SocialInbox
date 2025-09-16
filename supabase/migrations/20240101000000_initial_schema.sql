-- Enable required extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- Tenancy tables
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner uuid not null references auth.users(id),
  created_at timestamptz default now()
);

create table public.team_members (
  team_id uuid references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner','admin','agent','viewer')) default 'admin',
  primary key (team_id, user_id),
  created_at timestamptz default now()
);

-- Connected IG accounts
create table public.ig_accounts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  instagram_user_id text not null unique,
  username text not null,
  access_token_enc bytea not null,
  token_expires_at timestamptz,
  connected_tools_enabled boolean default false,
  page_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contacts & conversations
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references public.ig_accounts(id) on delete cascade,
  ig_user_id text not null,
  display_name text,
  tags text[] default '{}',
  consent jsonb default '{}'::jsonb,
  first_seen_at timestamptz default now(),
  unique(ig_account_id, ig_user_id)
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid not null references public.ig_accounts(id) on delete cascade,
  contact_id uuid references public.contacts(id),
  ig_thread_id text not null,
  last_user_ts timestamptz,
  last_agent_ts timestamptz,
  window_expires_at timestamptz,
  status text check (status in ('open','snoozed','closed')) default 'open',
  human_agent_until timestamptz,
  automation_paused boolean default false,
  unique(ig_account_id, ig_thread_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  direction text check (direction in ('in','out')) not null,
  msg_type text check (msg_type in ('text','quick_reply','media','system')) not null,
  payload jsonb not null,
  policy_tag text check (policy_tag in ('NONE','HUMAN_AGENT')) default 'NONE',
  delivery_status text check (delivery_status in ('queued','sent','delivered','failed')) default 'queued',
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Flows & triggers
create table public.flows (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  spec jsonb not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.flow_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  spec jsonb not null,
  preview_image_url text,
  usage_count int default 0,
  is_public boolean default true,
  created_at timestamptz default now()
);

create table public.triggers (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  ig_account_id uuid not null references public.ig_accounts(id) on delete cascade,
  trigger_type text check (trigger_type in ('comment','story_reply','mention')) not null,
  post_scope jsonb,
  filters jsonb,
  public_replies text[] default '{}',
  flow_id uuid not null references public.flows(id) on delete cascade,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- User attributes for personalization
create table public.user_attributes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  key text not null,
  value jsonb,
  updated_at timestamptz default now(),
  unique(contact_id, key)
);

-- Flow execution state
create table public.flow_executions (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id),
  flow_id uuid not null references public.flows(id),
  current_node_id text,
  context jsonb not null default '{}'::jsonb,
  status text check (status in ('active','waiting','completed','failed')) default 'active',
  started_at timestamptz default now(),
  completed_at timestamptz
);

-- Raw webhook events (for replay and debugging)
create table public.events_inbox (
  id bigserial primary key,
  ig_account_id uuid references public.ig_accounts(id) on delete set null,
  payload jsonb not null,
  received_at timestamptz default now(),
  processed boolean default false,
  processed_at timestamptz,
  error text
);

-- Analytics
create table public.trigger_metrics (
  id bigserial primary key,
  trigger_id uuid references public.triggers(id) on delete cascade,
  metric_date date not null,
  comments_received int default 0,
  dms_started int default 0,
  opt_ins int default 0,
  ctr numeric(6,4) default 0,
  unique (trigger_id, metric_date)
);

create table public.conversation_metrics (
  id bigserial primary key,
  ig_account_id uuid references public.ig_accounts(id) on delete cascade,
  metric_date date not null,
  conversations_started int default 0,
  messages_sent int default 0,
  messages_received int default 0,
  avg_response_time_seconds int,
  unique (ig_account_id, metric_date)
);

-- Rate limiting buckets
create table public.rate_limit_buckets (
  id uuid primary key default gen_random_uuid(),
  ig_account_id uuid references public.ig_accounts(id) on delete cascade,
  bucket_type text not null,
  window_start timestamptz not null,
  tokens_used int default 0,
  unique(ig_account_id, bucket_type, window_start)
);

-- Broadcast campaigns
create table public.broadcast_campaigns (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  segment_filters jsonb,
  message_content jsonb,
  scheduled_at timestamptz,
  status text check (status in ('draft','scheduled','sending','completed','cancelled')) default 'draft',
  sent_count int default 0,
  created_at timestamptz default now()
);

-- Helpful indexes
create index on public.contacts (ig_account_id, ig_user_id);
create index on public.conversations (ig_account_id, status);
create index on public.conversations (window_expires_at) where status = 'open';
create index on public.messages (conversation_id, created_at desc);
create index on public.events_inbox (received_at desc) where processed = false;
create index on public.flow_executions (conversation_id, status);
create index on public.flow_executions (status) where status in ('active', 'waiting');
create index on public.rate_limit_buckets (ig_account_id, bucket_type, window_start);

-- Enable Row Level Security
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.ig_accounts enable row level security;
alter table public.contacts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.flows enable row level security;
alter table public.flow_templates enable row level security;
alter table public.triggers enable row level security;
alter table public.user_attributes enable row level security;
alter table public.flow_executions enable row level security;
alter table public.events_inbox enable row level security;
alter table public.trigger_metrics enable row level security;
alter table public.conversation_metrics enable row level security;
alter table public.rate_limit_buckets enable row level security;
alter table public.broadcast_campaigns enable row level security;

-- RLS Policies
-- Team members can view their teams
create policy "Team members can view their teams"
  on public.teams for select
  using (
    exists(
      select 1 from public.team_members tm 
      where tm.team_id = teams.id 
      and tm.user_id = auth.uid()
    )
  );

-- Team owners can update their teams
create policy "Team owners can update their teams"
  on public.teams for update
  using (owner = auth.uid());

-- Team members can view team membership
create policy "Team members can view team membership"
  on public.team_members for select
  using (
    exists(
      select 1 from public.team_members tm 
      where tm.team_id = team_members.team_id 
      and tm.user_id = auth.uid()
    )
  );

-- Team-based access for IG accounts
create policy "Team members can manage IG accounts"
  on public.ig_accounts for all
  using (
    exists(
      select 1 from public.team_members tm 
      where tm.team_id = ig_accounts.team_id 
      and tm.user_id = auth.uid()
    )
  );

-- Team-based access for contacts
create policy "Team members can view contacts"
  on public.contacts for select
  using (
    exists(
      select 1 from public.ig_accounts ia
      join public.team_members tm on tm.team_id = ia.team_id
      where ia.id = contacts.ig_account_id
      and tm.user_id = auth.uid()
    )
  );

-- Team-based access for conversations
create policy "Team members can view conversations"
  on public.conversations for select
  using (
    exists(
      select 1 from public.ig_accounts ia
      join public.team_members tm on tm.team_id = ia.team_id
      where ia.id = conversations.ig_account_id
      and tm.user_id = auth.uid()
    )
  );

-- Team-based access for messages
create policy "Team members can view messages"
  on public.messages for select
  using (
    exists(
      select 1 from public.conversations c
      join public.ig_accounts ia on ia.id = c.ig_account_id
      join public.team_members tm on tm.team_id = ia.team_id
      where c.id = messages.conversation_id
      and tm.user_id = auth.uid()
    )
  );

-- Team-based access for flows
create policy "Team members can manage flows"
  on public.flows for all
  using (
    exists(
      select 1 from public.team_members tm 
      where tm.team_id = flows.team_id 
      and tm.user_id = auth.uid()
    )
  );

-- Public flow templates are viewable by all
create policy "Public flow templates are viewable by all"
  on public.flow_templates for select
  using (is_public = true);

-- Team-based access for triggers
create policy "Team members can manage triggers"
  on public.triggers for all
  using (
    exists(
      select 1 from public.team_members tm 
      where tm.team_id = triggers.team_id 
      and tm.user_id = auth.uid()
    )
  );

-- Block direct access to events_inbox (only Edge Functions should access)
-- No RLS policies = no access from client

-- Team-based access for metrics
create policy "Team members can view trigger metrics"
  on public.trigger_metrics for select
  using (
    exists(
      select 1 from public.triggers t
      join public.team_members tm on tm.team_id = t.team_id
      where t.id = trigger_metrics.trigger_id
      and tm.user_id = auth.uid()
    )
  );

-- Functions for token encryption/decryption (Edge Functions only)
create or replace function decrypt_token(token_enc bytea, key text)
returns text
language plpgsql
security definer
as $$
begin
  -- Only allow from service role
  if current_setting('request.jwt.claims', true)::json->>'role' != 'service_role' then
    raise exception 'Unauthorized';
  end if;
  
  return pgp_sym_decrypt(token_enc, key);
end;
$$;

-- Trigger to update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_ig_accounts_updated_at before update on public.ig_accounts
  for each row execute function update_updated_at();

create trigger update_flows_updated_at before update on public.flows
  for each row execute function update_updated_at();

-- Enable realtime for conversations and messages
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;