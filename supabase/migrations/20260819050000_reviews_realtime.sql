-- Publish reviews so other group members can refresh ratings live.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'reviews'
  ) then
    execute 'alter publication supabase_realtime add table public.reviews';
  end if;
end;
$$;
