-- Members leave through a privileged function so owners cannot abandon a group.

create or replace function public.leave_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  membership_role text;
begin
  if uid is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select role into membership_role
  from public.group_members
  where group_id = p_group_id
    and user_id = uid;

  if membership_role is null then
    raise exception 'Not a group member' using errcode = '42501';
  end if;

  if membership_role = 'owner' then
    raise exception 'Transfer ownership or delete the group before leaving'
      using errcode = '42501';
  end if;

  delete from public.group_members
  where group_id = p_group_id
    and user_id = uid;
end;
$$;

revoke all on function public.leave_group(uuid) from public;
grant execute on function public.leave_group(uuid) to authenticated;
