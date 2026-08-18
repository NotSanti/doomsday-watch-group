-- Owners can recopy an invite until it is revoked.
-- Redemption still looks up the hashed token so members/anon cannot list links.

alter table public.group_invites
  add column token text;

create unique index group_invites_token_key
  on public.group_invites (token)
  where token is not null;

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
    token,
    token_hash,
    created_by,
    expires_at,
    max_uses
  )
  values (
    p_group_id,
    raw_token,
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
  set
    revoked_at = now(),
    token = null
  where id = p_invite_id
    and revoked_at is null;
end;
$$;
