-- Publish membership changes so active group clients can refresh rosters.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'group_members'
  ) then
    execute 'alter publication supabase_realtime add table public.group_members';
  end if;
end;
$$;
