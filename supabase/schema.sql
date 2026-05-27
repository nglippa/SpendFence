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

create policy "Users can read their own bank connections"
  on public.bank_connections
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own bank connections"
  on public.bank_connections
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own bank connections"
  on public.bank_connections
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
