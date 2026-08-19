-- Keep started_at / watched_at aligned with status, and publish
-- progress plus group rows so other clients can refresh.

create or replace function public.tg_progress_timestamps()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'not_started' then
    new.started_at := null;
    new.watched_at := null;
  elsif new.status = 'watching' then
    if tg_op = 'UPDATE' then
      new.started_at := coalesce(old.started_at, now());
    else
      new.started_at := coalesce(new.started_at, now());
    end if;
    new.watched_at := null;
  elsif new.status = 'watched' then
    if tg_op = 'UPDATE' then
      new.started_at := coalesce(old.started_at, now());
      if old.status = 'watched' then
        new.watched_at := coalesce(old.watched_at, now());
      else
        new.watched_at := now();
      end if;
    else
      new.started_at := coalesce(new.started_at, now());
      new.watched_at := coalesce(new.watched_at, now());
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists member_title_progress_timestamps on public.member_title_progress;

create trigger member_title_progress_timestamps
  before insert or update of status, started_at, watched_at on public.member_title_progress
  for each row execute function public.tg_progress_timestamps();

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'member_title_progress'
  ) then
    execute 'alter publication supabase_realtime add table public.member_title_progress';
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'groups'
  ) then
    execute 'alter publication supabase_realtime add table public.groups';
  end if;
end;
$$;
