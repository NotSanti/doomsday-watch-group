-- Per-group skipped titles (omit from Doomsday path / stats)

create table public.group_skipped_titles (
  group_id uuid not null references public.groups (id) on delete cascade,
  title_id uuid not null references public.titles (id) on delete cascade,
  skipped_by uuid not null references public.profiles (id),
  skipped_at timestamptz not null default now(),
  primary key (group_id, title_id)
);

create index group_skipped_titles_group_id_idx
  on public.group_skipped_titles (group_id);

alter table public.group_skipped_titles enable row level security;

create policy group_skipped_titles_select on public.group_skipped_titles
  for select to authenticated
  using (public.is_group_member(group_id));

create policy group_skipped_titles_insert on public.group_skipped_titles
  for insert to authenticated
  with check (
    public.is_group_owner(group_id)
    and skipped_by = auth.uid()
  );

create policy group_skipped_titles_delete on public.group_skipped_titles
  for delete to authenticated
  using (public.is_group_owner(group_id));

revoke all on table public.group_skipped_titles from public;
grant select, insert, delete on table public.group_skipped_titles to authenticated;

-- Auto-advance skips titles the group has omitted from the path
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
    and not exists (
      select 1
      from public.group_skipped_titles gst
      where gst.group_id = p_group_id
        and gst.title_id = t.id
    )
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
