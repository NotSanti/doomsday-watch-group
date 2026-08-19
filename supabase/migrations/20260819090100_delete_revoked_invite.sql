-- Owners can remove revoked invites from the settings list.

create or replace function public.delete_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_group uuid;
  invite_revoked timestamptz;
begin
  select group_id, revoked_at
  into invite_group, invite_revoked
  from public.group_invites
  where id = p_invite_id;

  if invite_group is null then
    raise exception 'Invite not found' using errcode = '22023';
  end if;

  if not public.is_group_owner(invite_group) then
    raise exception 'Only owners can delete invites' using errcode = '42501';
  end if;

  if invite_revoked is null then
    raise exception 'Only revoked invites can be deleted' using errcode = '22023';
  end if;

  delete from public.group_invites
  where id = p_invite_id;
end;
$$;

revoke all on function public.delete_invite(uuid) from public;
grant execute on function public.delete_invite(uuid) to authenticated;
