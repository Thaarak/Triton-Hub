-- Run in Supabase SQL editor once so Gmail can be loaded after Supabase session refresh
-- (provider_token is not always present on the server session).
alter table public.profiles add column if not exists google_refresh_token text;
