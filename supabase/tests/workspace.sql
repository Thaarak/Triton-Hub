-- Run against a disposable Supabase database as postgres.
begin;
insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-4000-8000-000000000001', 'test-student-one@example.test', '{}'),
  ('10000000-0000-4000-8000-000000000002', 'test-student-two@example.test', '{}');

set local role service_role;
insert into public.integration_credentials (user_id, provider, encrypted_token)
values ('10000000-0000-4000-8000-000000000001', 'canvas', 'test-ciphertext');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
insert into public.notifications (user_id, source, category, summary, event_date)
values (auth.uid(), 'Personal', 'personal', 'Study session', '2026-11-17');
update public.notifications set completed = true where summary = 'Study session';

do $$
begin
  if not exists (select from public.notifications where summary = 'Study session' and completed) then
    raise exception 'Owner could not save and complete an event';
  end if;
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'Profile isolation failed';
  end if;
  begin
    perform encrypted_token from public.integration_credentials;
    raise exception 'Browser role can read integration credentials';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
do $$
begin
  if exists (select from public.notifications where summary = 'Study session') then
    raise exception 'Another user can read the event';
  end if;
  update public.notifications set completed = false where summary = 'Study session';
  if found then raise exception 'Another user can edit the event'; end if;
  begin
    insert into public.notifications (user_id, source, category, summary)
    values ('10000000-0000-4000-8000-000000000001', 'Personal', 'personal', 'Wrong owner');
    raise exception 'Another user can create an event for the owner';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
