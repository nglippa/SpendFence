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
