-- Notification preferences, outbox, and dispatch pipeline (Milestone 14)

create schema if not exists private;

create table private.runtime_config (
  key text primary key,
  value text not null
);

revoke all on schema private from public;
revoke all on table private.runtime_config from public;
grant usage on schema private to postgres, service_role;

insert into private.runtime_config (key, value)
values
  ('app_base_url', 'https://doomwatchparty.online'),
  ('functions_base_url', 'http://host.docker.internal:54321/functions/v1'),
  ('push_internal_secret', 'local-dev-push-secret-change-me')
on conflict (key) do nothing;

create extension if not exists pg_net with schema extensions;

create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  member_joined boolean not null default true,
  member_watched boolean not null default true,
  member_rated boolean not null default true,
  member_reviewed boolean not null default true,
  group_ready_for_next_title boolean not null default true,
  daily_countdown boolean not null default false,
  last_daily_countdown_sent_on date,
  updated_at timestamptz not null default now()
);

create type public.notification_outbox_status as enum ('pending', 'sent', 'failed');

create table public.notification_outbox (
  id bigint generated always as identity primary key,
  notification_type text not null,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  status public.notification_outbox_status not null default 'pending',
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index notification_outbox_pending_idx
  on public.notification_outbox (status, created_at)
  where status = 'pending';

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

alter table public.notification_preferences enable row level security;
alter table public.notification_outbox enable row level security;

create policy notification_preferences_select on public.notification_preferences
  for select to authenticated
  using (user_id = auth.uid());

create policy notification_preferences_insert on public.notification_preferences
  for insert to authenticated
  with check (user_id = auth.uid());

create policy notification_preferences_update on public.notification_preferences
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.notification_preferences to authenticated;

grant select, update on public.notification_outbox to service_role;
grant select, delete on public.push_subscriptions to service_role;
grant select, update on public.notification_preferences to service_role;

create or replace function public.ensure_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists profiles_notification_preferences on public.profiles;

create trigger profiles_notification_preferences
  after insert on public.profiles
  for each row execute function public.ensure_notification_preferences();

insert into public.notification_preferences (user_id)
select id from public.profiles
on conflict (user_id) do nothing;

create or replace function private.config_value(p_key text)
returns text
language sql
stable
security definer
set search_path = private, public
as $$
  select value from private.runtime_config where key = p_key;
$$;

create or replace function public.enqueue_notification(
  p_type text,
  p_recipient_id uuid,
  p_payload jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public, private
as $$
declare
  new_id bigint;
begin
  insert into public.notification_outbox (notification_type, recipient_id, payload)
  values (p_type, p_recipient_id, p_payload)
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.enqueue_notification(text, uuid, jsonb) from public;
grant execute on function public.enqueue_notification(text, uuid, jsonb) to service_role;

create or replace function private.dispatch_outbox_notification()
returns trigger
language plpgsql
security definer
set search_path = public, private, extensions
as $$
declare
  base_url text;
  secret text;
begin
  base_url := private.config_value('functions_base_url');
  secret := private.config_value('push_internal_secret');

  if base_url is null or secret is null then
    return new;
  end if;

  perform net.http_post(
    url := rtrim(base_url, '/') || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Push-Internal-Secret', secret
    ),
    body := jsonb_build_object('outbox_id', new.id)
  );

  return new;
exception
  when others then
    update public.notification_outbox
    set status = 'failed', error = SQLERRM
    where id = new.id;
    return new;
end;
$$;

create trigger notification_outbox_dispatch
  after insert on public.notification_outbox
  for each row execute function private.dispatch_outbox_notification();
