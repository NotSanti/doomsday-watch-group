-- Group activity notification triggers and auto-advance (Milestones 15–16)

create or replace function private.notify_group_members_except(
  p_group_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  member record;
begin
  for member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id <> p_actor_id
  loop
    perform public.enqueue_notification(
      p_type,
      member.user_id,
      jsonb_build_object(
        'title', p_title,
        'body', p_body,
        'url', p_url
      )
    );
  end loop;
end;
$$;

create or replace function private.notify_all_group_members(
  p_group_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_url text
)
returns void
language plpgsql
security definer
set search_path = public, private
as $$
declare
  member record;
begin
  for member in
    select gm.user_id
    from public.group_members gm
    where gm.group_id = p_group_id
  loop
    perform public.enqueue_notification(
      p_type,
      member.user_id,
      jsonb_build_object(
        'title', p_title,
        'body', p_body,
        'url', p_url
      )
    );
  end loop;
end;
$$;

create or replace function public.notify_member_joined()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  group_name text;
  actor_name text;
  app_url text;
begin
  select g.name into group_name from public.groups g where g.id = new.group_id;
  select p.display_name into actor_name from public.profiles p where p.id = new.user_id;
  app_url := coalesce(private.config_value('app_base_url'), 'https://doomwatchparty.online');

  perform private.notify_group_members_except(
    new.group_id,
    new.user_id,
    'member_joined',
    actor_name || ' joined ' || group_name,
    'Open your group dashboard to see them.',
    rtrim(app_url, '/') || '/groups/' || new.group_id::text
  );

  return new;
end;
$$;

drop trigger if exists group_members_notify_joined on public.group_members;

create trigger group_members_notify_joined
  after insert on public.group_members
  for each row execute function public.notify_member_joined();

create or replace function public.advance_current_title_if_ready(p_group_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_id uuid;
  next_id uuid;
  member_count integer;
  watched_count integer;
  current_order integer;
begin
  select g.current_title_id into current_id
  from public.groups g
  where g.id = p_group_id;

  if current_id is null then
    return null;
  end if;

  select count(*)::integer into member_count
  from public.group_members gm
  where gm.group_id = p_group_id;

  select count(*)::integer into watched_count
  from public.member_title_progress mtp
  where mtp.group_id = p_group_id
    and mtp.title_id = current_id
    and mtp.status = 'watched';

  if member_count = 0 or watched_count < member_count then
    return null;
  end if;

  select t.doomsday_order into current_order
  from public.titles t
  where t.id = current_id;

  select t.id into next_id
  from public.titles t
  where t.is_active
    and t.doomsday_order is not null
    and t.doomsday_order > coalesce(current_order, -1)
  order by t.doomsday_order asc
  limit 1;

  update public.groups g
  set current_title_id = next_id
  where g.id = p_group_id
    and g.current_title_id = current_id;

  if not found then
    return null;
  end if;

  return next_id;
end;
$$;

revoke all on function public.advance_current_title_if_ready(uuid) from public;
grant execute on function public.advance_current_title_if_ready(uuid) to service_role;

create or replace function public.notify_member_watched()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  group_name text;
  actor_name text;
  title_name text;
  app_url text;
  group_url text;
  previous_current uuid;
  next_title_id uuid;
  next_title_name text;
begin
  if new.status <> 'watched' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'watched' then
    return new;
  end if;

  select g.name into group_name from public.groups g where g.id = new.group_id;
  select p.display_name into actor_name from public.profiles p where p.id = new.user_id;
  select t.name into title_name from public.titles t where t.id = new.title_id;
  app_url := coalesce(private.config_value('app_base_url'), 'https://doomwatchparty.online');
  group_url := rtrim(app_url, '/') || '/groups/' || new.group_id::text;

  perform private.notify_group_members_except(
    new.group_id,
    new.user_id,
    'member_watched',
    actor_name || ' watched ' || coalesce(title_name, 'a title'),
    group_name,
    rtrim(app_url, '/') || '/groups/' || new.group_id::text || '/titles/' || new.title_id::text
  );

  select g.current_title_id into previous_current
  from public.groups g
  where g.id = new.group_id;

  next_title_id := public.advance_current_title_if_ready(new.group_id);

  if previous_current is distinct from (
    select g.current_title_id from public.groups g where g.id = new.group_id
  ) then
    if next_title_id is not null then
      select t.name into next_title_name
      from public.titles t
      where t.id = next_title_id;

      perform private.notify_all_group_members(
        new.group_id,
        'group_ready_for_next_title',
        group_name || ' is ready for the next title',
        'Now watching: ' || next_title_name,
        group_url
      );
    else
      perform private.notify_all_group_members(
        new.group_id,
        'group_ready_for_next_title',
        group_name || ' finished the watch order',
        'You completed every title on the road to Doomsday.',
        group_url
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists member_title_progress_notify_watched on public.member_title_progress;

create trigger member_title_progress_notify_watched
  after insert or update on public.member_title_progress
  for each row execute function public.notify_member_watched();

create or replace function public.notify_review_activity()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
declare
  group_name text;
  actor_name text;
  title_name text;
  app_url text;
  title_url text;
  rating_changed boolean;
  review_changed boolean;
begin
  rating_changed :=
    tg_op = 'INSERT'
    or new.rating is distinct from old.rating;

  review_changed :=
    (tg_op = 'INSERT' and new.body is not null and btrim(new.body) <> '')
    or (
      tg_op = 'UPDATE'
      and new.body is distinct from old.body
      and new.body is not null
      and btrim(new.body) <> ''
    );

  if not rating_changed and not review_changed then
    return new;
  end if;

  select g.name into group_name from public.groups g where g.id = new.group_id;
  select p.display_name into actor_name from public.profiles p where p.id = new.user_id;
  select t.name into title_name from public.titles t where t.id = new.title_id;
  app_url := coalesce(private.config_value('app_base_url'), 'https://doomwatchparty.online');
  title_url := rtrim(app_url, '/') || '/groups/' || new.group_id::text || '/titles/' || new.title_id::text;

  if rating_changed then
    perform private.notify_group_members_except(
      new.group_id,
      new.user_id,
      'member_rated',
      actor_name || ' rated ' || coalesce(title_name, 'a title'),
      'Score: ' || new.rating::text || '/10 in ' || group_name,
      title_url
    );
  end if;

  if review_changed then
    perform private.notify_group_members_except(
      new.group_id,
      new.user_id,
      'member_reviewed',
      actor_name || ' reviewed ' || coalesce(title_name, 'a title'),
      group_name,
      title_url
    );
  end if;

  return new;
end;
$$;

drop trigger if exists reviews_notify_activity on public.reviews;

create trigger reviews_notify_activity
  after insert or update on public.reviews
  for each row execute function public.notify_review_activity();
