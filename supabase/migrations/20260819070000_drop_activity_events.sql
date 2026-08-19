-- Activity events are unused. Stop writing them and remove the table.

create or replace function public.create_group(
  p_name text,
  p_description text default null,
  p_target_date timestamptz default timestamptz '2026-12-18 00:00:00-05',
  p_timezone text default 'America/Toronto'
)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  new_group public.groups;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  insert into public.groups (name, description, owner_id, target_date, timezone)
  values (
    trim(p_name),
    nullif(trim(p_description), ''),
    uid,
    p_target_date,
    p_timezone
  )
  returning * into new_group;

  insert into public.group_members (group_id, user_id, role)
  values (new_group.id, uid, 'owner');

  return new_group;
end;
$$;

create or replace function public.redeem_invite(p_token text)
returns table (group_id uuid, already_member boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  invite public.group_invites;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select * into invite
  from public.group_invites
  where token_hash = public.hash_invite_token(p_token)
  for update;

  if invite.id is null then
    raise exception 'Invite is not valid' using errcode = '22023';
  end if;

  if invite.revoked_at is not null then
    raise exception 'Invite is revoked' using errcode = '22023';
  end if;

  if invite.expires_at is not null and invite.expires_at <= now() then
    raise exception 'Invite is expired' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.group_members
    where public.group_members.group_id = invite.group_id
      and user_id = uid
  ) then
    group_id := invite.group_id;
    already_member := true;
    return next;
    return;
  end if;

  if invite.max_uses is not null and invite.use_count >= invite.max_uses then
    raise exception 'Invite has no remaining uses' using errcode = '22023';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (invite.group_id, uid, 'member');

  update public.group_invites
  set use_count = public.group_invites.use_count + 1
  where id = invite.id;

  group_id := invite.group_id;
  already_member := false;
  return next;
end;
$$;

drop trigger if exists member_title_progress_activity on public.member_title_progress;
drop trigger if exists reviews_activity on public.reviews;
drop function if exists public.tg_progress_activity();
drop function if exists public.tg_review_activity();
drop table if exists public.activity_events;
