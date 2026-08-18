-- Membership helpers, privileged RPCs, activity triggers, grants, and RLS

create or replace function public.is_group_member(group_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = group_uuid
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_owner(group_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = group_uuid
      and user_id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function public.current_user_is_membership(
  group_uuid uuid,
  user_uuid uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = user_uuid
    and public.is_group_member(group_uuid);
$$;

create or replace function public.hash_invite_token(raw_token text)
returns text
language sql
immutable
set search_path = public, extensions
as $$
  select encode(extensions.digest(convert_to(raw_token, 'UTF8'), 'sha256'), 'hex');
$$;

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

  insert into public.activity_events (group_id, actor_id, event_type)
  values (new_group.id, uid, 'joined');

  return new_group;
end;
$$;

create or replace function public.create_invite(
  p_group_id uuid,
  p_expires_at timestamptz default null,
  p_max_uses integer default null
)
returns table (invite_id uuid, token text, expires_at timestamptz, max_uses integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  raw_token text;
begin
  if uid is null or not public.is_group_owner(p_group_id) then
    raise exception 'Only owners can create invites' using errcode = '42501';
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.group_invites (
    group_id,
    token_hash,
    created_by,
    expires_at,
    max_uses
  )
  values (
    p_group_id,
    public.hash_invite_token(raw_token),
    uid,
    p_expires_at,
    p_max_uses
  )
  returning public.group_invites.id into invite_id;

  token := raw_token;
  expires_at := p_expires_at;
  max_uses := p_max_uses;
  return next;
end;
$$;

create or replace function public.preview_invite(p_token text)
returns table (
  group_name text,
  owner_display_name text,
  member_count integer,
  is_valid boolean,
  invalid_reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  invite public.group_invites;
begin
  select * into invite
  from public.group_invites
  where token_hash = public.hash_invite_token(p_token);

  if invite.id is null then
    group_name := null;
    owner_display_name := null;
    member_count := null;
    is_valid := false;
    invalid_reason := 'invalid';
    return next;
    return;
  end if;

  select g.name, p.display_name
    into group_name, owner_display_name
  from public.groups g
  join public.profiles p on p.id = g.owner_id
  where g.id = invite.group_id;

  select count(*)::integer into member_count
  from public.group_members
  where group_id = invite.group_id;

  if invite.revoked_at is not null then
    is_valid := false;
    invalid_reason := 'revoked';
  elsif invite.expires_at is not null and invite.expires_at <= now() then
    is_valid := false;
    invalid_reason := 'expired';
  elsif invite.max_uses is not null and invite.use_count >= invite.max_uses then
    is_valid := false;
    invalid_reason := 'exhausted';
  else
    is_valid := true;
    invalid_reason := null;
  end if;

  return next;
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

  insert into public.activity_events (group_id, actor_id, event_type)
  values (invite.group_id, uid, 'joined');

  group_id := invite.group_id;
  already_member := false;
  return next;
end;
$$;

create or replace function public.revoke_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_group uuid;
begin
  select group_id into invite_group
  from public.group_invites
  where id = p_invite_id;

  if invite_group is null then
    raise exception 'Invite not found' using errcode = '22023';
  end if;

  if not public.is_group_owner(invite_group) then
    raise exception 'Only owners can revoke invites' using errcode = '42501';
  end if;

  update public.group_invites
  set revoked_at = now()
  where id = p_invite_id
    and revoked_at is null;
end;
$$;

create or replace function public.transfer_ownership(
  p_group_id uuid,
  p_new_owner_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null or not public.is_group_owner(p_group_id) then
    raise exception 'Only the owner can transfer ownership' using errcode = '42501';
  end if;

  if p_new_owner_id = uid then
    return;
  end if;

  if not exists (
    select 1
    from public.group_members
    where group_id = p_group_id
      and user_id = p_new_owner_id
  ) then
    raise exception 'New owner must already be a group member' using errcode = '22023';
  end if;

  update public.group_members
  set role = 'member'
  where group_id = p_group_id
    and user_id = uid;

  update public.group_members
  set role = 'owner'
  where group_id = p_group_id
    and user_id = p_new_owner_id;

  update public.groups
  set owner_id = p_new_owner_id
  where id = p_group_id;
end;
$$;

create or replace function public.tg_progress_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'watching' then
      insert into public.activity_events (group_id, actor_id, event_type, title_id)
      values (new.group_id, new.user_id, 'started', new.title_id);
    elsif new.status = 'watched' then
      insert into public.activity_events (group_id, actor_id, event_type, title_id)
      values (new.group_id, new.user_id, 'completed', new.title_id);
    end if;
  elsif new.status is distinct from old.status then
    if new.status = 'watching' then
      insert into public.activity_events (group_id, actor_id, event_type, title_id)
      values (new.group_id, new.user_id, 'started', new.title_id);
    elsif new.status = 'watched' then
      insert into public.activity_events (group_id, actor_id, event_type, title_id)
      values (new.group_id, new.user_id, 'completed', new.title_id);
    end if;
  end if;

  return new;
end;
$$;

create trigger member_title_progress_activity
  after insert or update of status on public.member_title_progress
  for each row execute function public.tg_progress_activity();

create or replace function public.tg_review_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.activity_events (group_id, actor_id, event_type, title_id, metadata)
  values (
    new.group_id,
    new.user_id,
    'rated',
    new.title_id,
    jsonb_build_object('rating', new.rating)
  );

  if new.body is not null and btrim(new.body) <> '' then
    insert into public.activity_events (group_id, actor_id, event_type, title_id)
    values (new.group_id, new.user_id, 'reviewed', new.title_id);
  end if;

  return new;
end;
$$;

create trigger reviews_activity
  after insert or update of rating, body on public.reviews
  for each row execute function public.tg_review_activity();

revoke all on function public.create_group(text, text, timestamptz, text) from public;
revoke all on function public.create_invite(uuid, timestamptz, integer) from public;
revoke all on function public.redeem_invite(text) from public;
revoke all on function public.revoke_invite(uuid) from public;
revoke all on function public.transfer_ownership(uuid, uuid) from public;
revoke all on function public.preview_invite(text) from public;
revoke all on function public.is_group_member(uuid) from public;
revoke all on function public.is_group_owner(uuid) from public;
revoke all on function public.current_user_is_membership(uuid, uuid) from public;
revoke all on function public.hash_invite_token(text) from public;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.groups from anon, authenticated;
revoke all on table public.group_members from anon, authenticated;
revoke all on table public.group_invites from anon, authenticated;
revoke all on table public.titles from anon, authenticated;
revoke all on table public.member_title_progress from anon, authenticated;
revoke all on table public.reviews from anon, authenticated;
revoke all on table public.activity_events from anon, authenticated;

grant select, update on table public.profiles to authenticated;
grant select, update, delete on table public.groups to authenticated;
grant select, delete on table public.group_members to authenticated;
grant select on table public.group_invites to authenticated;
grant select on table public.titles to authenticated;
grant select, insert, update, delete on table public.member_title_progress to authenticated;
grant select, insert, update, delete on table public.reviews to authenticated;
grant select on table public.activity_events to authenticated;

grant execute on function public.create_group(text, text, timestamptz, text) to authenticated;
grant execute on function public.create_invite(uuid, timestamptz, integer) to authenticated;
grant execute on function public.redeem_invite(text) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
grant execute on function public.transfer_ownership(uuid, uuid) to authenticated;
grant execute on function public.preview_invite(text) to anon, authenticated;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.current_user_is_membership(uuid, uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;
alter table public.titles enable row level security;
alter table public.member_title_progress enable row level security;
alter table public.reviews enable row level security;
alter table public.activity_events enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.group_members mine
      join public.group_members theirs
        on mine.group_id = theirs.group_id
      where mine.user_id = auth.uid()
        and theirs.user_id = profiles.id
    )
  );

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy groups_select on public.groups
  for select to authenticated
  using (public.is_group_member(id));

create policy groups_update on public.groups
  for update to authenticated
  using (public.is_group_owner(id))
  with check (public.is_group_owner(id));

create policy groups_delete on public.groups
  for delete to authenticated
  using (public.is_group_owner(id));

create policy group_members_select on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

create policy group_members_delete on public.group_members
  for delete to authenticated
  using (public.is_group_owner(group_id) and user_id <> auth.uid());

create policy group_invites_select on public.group_invites
  for select to authenticated
  using (public.is_group_owner(group_id));

create policy titles_select on public.titles
  for select to authenticated
  using (is_active);

create policy progress_select on public.member_title_progress
  for select to authenticated
  using (public.is_group_member(group_id));

create policy progress_insert on public.member_title_progress
  for insert to authenticated
  with check (public.current_user_is_membership(group_id, user_id));

create policy progress_update on public.member_title_progress
  for update to authenticated
  using (public.current_user_is_membership(group_id, user_id))
  with check (public.current_user_is_membership(group_id, user_id));

create policy progress_delete on public.member_title_progress
  for delete to authenticated
  using (public.current_user_is_membership(group_id, user_id));

create policy reviews_select on public.reviews
  for select to authenticated
  using (public.is_group_member(group_id));

create policy reviews_insert on public.reviews
  for insert to authenticated
  with check (public.current_user_is_membership(group_id, user_id));

create policy reviews_update on public.reviews
  for update to authenticated
  using (public.current_user_is_membership(group_id, user_id))
  with check (public.current_user_is_membership(group_id, user_id));

create policy reviews_delete on public.reviews
  for delete to authenticated
  using (public.current_user_is_membership(group_id, user_id));

create policy activity_select on public.activity_events
  for select to authenticated
  using (public.is_group_member(group_id));
