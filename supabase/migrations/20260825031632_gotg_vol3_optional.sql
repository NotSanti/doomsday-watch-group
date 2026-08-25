-- Off-path titles keep a null doomsday_order. Guardians of the Galaxy Vol. 3
-- was seeded as essential; mark it optional so importance matches that status.

update public.titles
set importance = 'optional'
where id = 'aa000000-0000-4000-8000-000000000026';
