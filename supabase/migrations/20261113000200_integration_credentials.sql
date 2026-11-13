create table if not exists public.integration_credentials (
  user_id uuid not null references auth.users on delete cascade,
  provider text not null check (provider in ('canvas', 'gmail')),
  encrypted_token text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, provider)
);

alter table public.integration_credentials enable row level security;
revoke all on public.integration_credentials from public, anon, authenticated;
grant select, insert, update, delete on public.integration_credentials to service_role;

-- Legacy plaintext tokens are deliberately discarded. Users reconnect once.
alter table public.profiles drop column if exists canvas_token;
alter table public.profiles drop column if exists google_refresh_token;
