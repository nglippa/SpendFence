create table if not exists public.bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null check (provider in ('teller')),
  access_token text not null,
  institution_name text,
  enrollment_id text,
  status text not null default 'connected',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bank_connections_user_id_idx on public.bank_connections(user_id);
create index if not exists bank_connections_provider_idx on public.bank_connections(provider);

alter table public.bank_connections enable row level security;

drop policy if exists "Users can read their own bank connections"
  on public.bank_connections;

drop policy if exists "Users can insert their own bank connections"
  on public.bank_connections;

drop policy if exists "Users can update their own bank connections"
  on public.bank_connections;

comment on table public.bank_connections is
  'Server-managed Teller enrollments. Access tokens must only be read through backend service-role API code.';

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions(stripe_customer_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

drop policy if exists "Users can read their own subscriptions"
  on public.subscriptions;

create policy "Users can read their own subscriptions"
  on public.subscriptions
  for select
  using (auth.uid() = user_id);

comment on table public.subscriptions is
  'Server-managed Stripe subscription status for Premium entitlement. Writes should happen through service-role API routes and verified webhooks.';

-- =====================================================================
-- Budgeting data (per-user). Client writes directly under RLS using the
-- user's session JWT. Application-generated string ids are preserved so
-- localStorage data can be migrated without remapping references.
-- =====================================================================

create table if not exists public.categories (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  monthly_limit numeric not null default 0,
  warning_threshold numeric not null default 80,
  hard_stop_threshold numeric not null default 100,
  color text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchases (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null default 0,
  category_id text,
  merchant text not null default '',
  date text,
  notes text,
  receipt_image text,
  recurring_id text,
  source text not null default 'manual',
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_purchases (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  amount numeric not null default 0,
  kind text not null default 'bill',
  frequency text not null default 'monthly',
  next_date text,
  category_id text,
  notes text,
  active boolean not null default true,
  source_purchase_id text,
  detected boolean not null default false,
  created_at text,
  updated_at text
);

create table if not exists public.spending_rules (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  description text not null default '',
  category_id text,
  merchant_pattern text,
  type text not null,
  condition text not null,
  threshold_amount numeric,
  threshold_count numeric,
  threshold_percent numeric,
  time_window text,
  time_context text,
  response text not null,
  enabled boolean not null default true,
  source text not null default 'manual',
  premium boolean,
  created_at text,
  updated_at text
);

create table if not exists public.imported_transactions (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  external_transaction_id text,
  import_source text,
  teller_account_id text,
  teller_account_name text,
  merchant_name text not null default '',
  description text not null default '',
  amount numeric not null default 0,
  date text,
  plaid_category text,
  suggested_category_id text,
  confidence numeric not null default 0,
  suggestion_reason text,
  suggestion_source text,
  review_status text not null default 'pending'
);

create table if not exists public.fence_learning_events (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  suggestion_id text,
  category_id text,
  suggestion_type text,
  decision text not null,
  previous_limit numeric,
  suggested_limit numeric,
  created_at text
);

create table if not exists public.app_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists recurring_purchases_user_id_idx on public.recurring_purchases(user_id);
create index if not exists spending_rules_user_id_idx on public.spending_rules(user_id);
create index if not exists imported_transactions_user_id_idx on public.imported_transactions(user_id);
create index if not exists fence_learning_events_user_id_idx on public.fence_learning_events(user_id);

alter table public.categories enable row level security;
alter table public.purchases enable row level security;
alter table public.recurring_purchases enable row level security;
alter table public.spending_rules enable row level security;
alter table public.imported_transactions enable row level security;
alter table public.fence_learning_events enable row level security;
alter table public.app_settings enable row level security;

-- Owner-only access for every budgeting table. Each policy restricts rows to
-- the authenticated user, so a session can never read or write another user's
-- data. Re-create idempotently so the schema can be applied repeatedly.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'categories',
    'purchases',
    'recurring_purchases',
    'spending_rules',
    'imported_transactions',
    'fence_learning_events',
    'app_settings'
  ]
  loop
    execute format('drop policy if exists "Owner can read %1$s" on public.%1$I;', tbl);
    execute format('drop policy if exists "Owner can insert %1$s" on public.%1$I;', tbl);
    execute format('drop policy if exists "Owner can update %1$s" on public.%1$I;', tbl);
    execute format('drop policy if exists "Owner can delete %1$s" on public.%1$I;', tbl);

    execute format('create policy "Owner can read %1$s" on public.%1$I for select using (auth.uid() = user_id);', tbl);
    execute format('create policy "Owner can insert %1$s" on public.%1$I for insert with check (auth.uid() = user_id);', tbl);
    execute format('create policy "Owner can update %1$s" on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl);
    execute format('create policy "Owner can delete %1$s" on public.%1$I for delete using (auth.uid() = user_id);', tbl);
  end loop;
end $$;

comment on table public.app_settings is
  'Per-user singleton settings blob (budget month, notification/insight/adaptive settings, onboarding profile, receipts, merchant rules, corrections, notifications). Normalized entities live in their own tables.';
