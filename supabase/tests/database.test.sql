begin;
select plan(73);

create temp table test_users (
  label text primary key,
  id uuid not null
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  rec.email,
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', rec.display_name),
  now(),
  now(),
  '',
  '',
  '',
  ''
from (
  values
    ('owner-a@example.test', 'Owner A'),
    ('member-a@example.test', 'Member A'),
    ('owner-b@example.test', 'Owner B'),
    ('outsider@example.test', 'Outsider'),
    ('outsider-2@example.test', 'Outsider Two')
) as rec (email, display_name);

insert into test_users (label, id)
select split_part(email, '@', 1), id
from auth.users
where email in (
  'owner-a@example.test',
  'member-a@example.test',
  'owner-b@example.test',
  'outsider@example.test',
  'outsider-2@example.test'
);

create temp table test_groups (
  label text primary key,
  id uuid not null
);

grant all on table test_users to authenticated;
grant all on table test_groups to authenticated;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  $$select public.create_group('Alpha Watch', 'Group A', timestamptz '2026-12-18 00:00:00-05')$$,
  'owner A can create a group'
);

insert into test_groups
select 'alpha', id from public.groups where name = 'Alpha Watch';

select is(
  (
    select count(*)::integer
    from public.group_members gm
    join public.groups g on g.id = gm.group_id
    where g.name = 'Alpha Watch'
      and gm.role = 'owner'
      and gm.user_id = (select id from test_users where label = 'owner-a')
  ),
  1,
  'group creation atomically inserts owner membership'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-b'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-b'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  $$select public.create_group('Beta Watch', 'Group B')$$,
  'owner B can create a separate group'
);

insert into test_groups
select 'beta', id from public.groups where name = 'Beta Watch';

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format(
    $$update public.profiles set avatar_url = 'icon:iron-man' where id = %L$$,
    (select id from test_users where label = 'owner-a')
  ),
  'users can save their own profile icon'
);

select is(
  (
    select avatar_url
    from public.profiles
    where id = (select id from test_users where label = 'owner-a')
  ),
  'icon:iron-man',
  'saved profile icon persists'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-b'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-b'),
    'role', 'authenticated'
  )::text,
  true
);

update public.profiles
set avatar_url = 'icon:spider-man'
where id = (select id from test_users where label = 'owner-a');

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select is(
  (
    select avatar_url
    from public.profiles
    where id = (select id from test_users where label = 'owner-a')
  ),
  'icon:iron-man',
  'users cannot update another profile icon'
);

create temp table alpha_invite as
select * from public.create_invite(
  (select id from test_groups where label = 'alpha'),
  now() + interval '7 days',
  2
);

select isnt(
  (select token from alpha_invite),
  (
    select token_hash
    from public.group_invites
    where id = (select invite_id from alpha_invite)
  ),
  'stored raw token is not the hash'
);

select is(
  (
    select token
    from public.group_invites
    where id = (select invite_id from alpha_invite)
  ),
  (select token from alpha_invite),
  'raw invite token is stored for owner recopy'
);

select is(
  (
    select is_valid
    from public.preview_invite((select token from alpha_invite))
  ),
  true,
  'preview_invite reports a live token as valid'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'member-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'member-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format($$select * from public.redeem_invite(%L)$$, (select token from alpha_invite)),
  'member can redeem a valid invite'
);

select is(
  (
    select already_member
    from public.redeem_invite((select token from alpha_invite))
  ),
  true,
  'repeat redemption is idempotent'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select is(
  (
    select use_count
    from public.group_invites
    where id = (select invite_id from alpha_invite)
  ),
  1,
  'idempotent redemption does not consume extra uses'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'member-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'member-a'),
    'role', 'authenticated'
  )::text,
  true
);

select throws_ok(
  format(
    $$insert into public.member_title_progress (group_id, user_id, title_id, status)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000001', 'watching')$$,
    (select id from test_groups where label = 'beta'),
    (select id from test_users where label = 'member-a')
  ),
  '42501',
  null,
  'member of A cannot write progress in group B'
);

select is(
  (select count(*)::integer from public.groups where name = 'Beta Watch'),
  0,
  'member of A cannot select group B'
);

select is(
  (
    select count(*)::integer
    from public.reviews
    where group_id = (select id from test_groups where label = 'beta')
  ),
  0,
  'member of A cannot select group B reviews'
);

select lives_ok(
  format(
    $$insert into public.member_title_progress (group_id, user_id, title_id, status, started_at)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000001', 'watching', now())$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can insert own progress'
);

select throws_ok(
  format(
    $$insert into public.member_title_progress (group_id, user_id, title_id, status)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000002', 'watching')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'owner-a')
  ),
  '42501',
  null,
  'member cannot insert progress for another user'
);

select lives_ok(
  format(
    $$insert into public.member_title_progress (group_id, user_id, title_id, status)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000002', 'watching')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can insert watching without supplying timestamps'
);

select isnt(
  (
    select started_at
    from public.member_title_progress
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'member-a')
      and title_id = 'aa000000-0000-4000-8000-000000000002'
  ),
  null,
  'watching sets started_at'
);

select is(
  (
    select watched_at
    from public.member_title_progress
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'member-a')
      and title_id = 'aa000000-0000-4000-8000-000000000002'
  ),
  null,
  'watching leaves watched_at empty'
);

select lives_ok(
  format(
    $$update public.member_title_progress
      set status = 'watched'
      where group_id = %L
        and user_id = %L
        and title_id = 'aa000000-0000-4000-8000-000000000002'$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can mark a title watched'
);

select isnt(
  (
    select watched_at
    from public.member_title_progress
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'member-a')
      and title_id = 'aa000000-0000-4000-8000-000000000002'
  ),
  null,
  'watched sets watched_at'
);

select lives_ok(
  format(
    $$update public.member_title_progress
      set status = 'watching'
      where group_id = %L
        and user_id = %L
        and title_id = 'aa000000-0000-4000-8000-000000000002'$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can return a title to watching'
);

select is(
  (
    select watched_at
    from public.member_title_progress
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'member-a')
      and title_id = 'aa000000-0000-4000-8000-000000000002'
  ),
  null,
  'returning to watching clears watched_at'
);

update public.groups
set current_title_id = 'aa000000-0000-4000-8000-000000000001'
where id = (select id from test_groups where label = 'alpha');

select is(
  (
    select current_title_id
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  null,
  'non-owner cannot change the current title'
);

select throws_ok(
  format(
    $$select * from public.create_invite(%L, now() + interval '1 day', 1)$$,
    (select id from test_groups where label = 'alpha')
  ),
  '42501',
  null,
  'non-owner cannot create invites'
);

select throws_ok(
  format(
    $$select public.revoke_invite(%L)$$,
    (select invite_id from alpha_invite)
  ),
  '42501',
  null,
  'non-owner cannot revoke invites'
);

select lives_ok(
  format(
    $$insert into public.reviews (group_id, user_id, title_id, rating, body)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000001', 8.5, 'Solid')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can create a review'
);

select throws_ok(
  format(
    $$insert into public.reviews (group_id, user_id, title_id, rating)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000001', 9.0)$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  '23505',
  null,
  'duplicate review for the same group/title is rejected'
);

select throws_ok(
  format(
    $$insert into public.reviews (group_id, user_id, title_id, rating)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000002', 8.3)$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  '23514',
  null,
  'ratings not in 0.5 increments are rejected'
);

select throws_ok(
  format(
    $$insert into public.reviews (group_id, user_id, title_id, rating, body)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000002', 7.0, %L)$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a'),
    repeat('x', 2001)
  ),
  '23514',
  null,
  'review bodies over 2000 characters are rejected'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format(
    $$update public.groups
      set current_title_id = 'aa000000-0000-4000-8000-000000000001'
      where id = %L$$,
    (select id from test_groups where label = 'alpha')
  ),
  'owner can change the current title'
);

select is(
  (
    select current_title_id
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  'aa000000-0000-4000-8000-000000000001'::uuid,
  'owner current-title update persists'
);

select lives_ok(
  format(
    $$insert into public.member_title_progress (group_id, user_id, title_id, status)
      values (%L, %L, 'aa000000-0000-4000-8000-000000000003', 'watching')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'owner-a')
  ),
  'owner can insert own progress'
);

insert into public.reviews (group_id, user_id, title_id, rating, body)
values (
  (select id from test_groups where label = 'alpha'),
  (select id from test_users where label = 'owner-a'),
  'aa000000-0000-4000-8000-000000000003',
  7.5,
  'Mine'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'member-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'member-a'),
    'role', 'authenticated'
  )::text,
  true
);

update public.member_title_progress
set status = 'watched'
where group_id = (select id from test_groups where label = 'alpha')
  and user_id = (select id from test_users where label = 'owner-a')
  and title_id = 'aa000000-0000-4000-8000-000000000003';

select is(
  (
    select status
    from public.member_title_progress
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'owner-a')
      and title_id = 'aa000000-0000-4000-8000-000000000003'
  ),
  'watching',
  'member cannot update another member’s progress'
);

update public.reviews
set rating = 1.0, body = 'hijack'
where group_id = (select id from test_groups where label = 'alpha')
  and user_id = (select id from test_users where label = 'owner-a')
  and title_id = 'aa000000-0000-4000-8000-000000000003';

select is(
  (
    select body
    from public.reviews
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'owner-a')
      and title_id = 'aa000000-0000-4000-8000-000000000003'
  ),
  'Mine',
  'member cannot update another member’s review'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-b'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-b'),
    'role', 'authenticated'
  )::text,
  true
);

create temp table expired_invite as
select * from public.create_invite(
  (select id from test_groups where label = 'beta'),
  now() - interval '1 hour',
  5
);

create temp table revoked_invite as
select * from public.create_invite(
  (select id from test_groups where label = 'beta'),
  now() + interval '1 day',
  5
);

select public.revoke_invite((select invite_id from revoked_invite));

select is(
  (
    select token
    from public.group_invites
    where id = (select invite_id from revoked_invite)
  ),
  null,
  'revoked invite token is cleared'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select throws_ok(
  format($$select public.delete_invite(%L)$$, (select invite_id from alpha_invite)),
  '22023',
  null,
  'active invites cannot be deleted'
);

select throws_ok(
  format($$select public.delete_invite(%L)$$, (select invite_id from revoked_invite)),
  '42501',
  null,
  'owners cannot delete invites for groups they do not own'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'member-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'member-a'),
    'role', 'authenticated'
  )::text,
  true
);

select throws_ok(
  format($$select public.delete_invite(%L)$$, (select invite_id from revoked_invite)),
  '42501',
  null,
  'non-owner cannot delete invites'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-b'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-b'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format($$select public.delete_invite(%L)$$, (select invite_id from revoked_invite)),
  'owner can delete a revoked invite'
);

select is(
  (select count(*)::integer from public.group_invites where id = (select invite_id from revoked_invite)),
  0,
  'deleted revoked invite is removed from the list'
);

create temp table exhausted_invite as
select * from public.create_invite(
  (select id from test_groups where label = 'beta'),
  now() + interval '1 day',
  1
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'outsider'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'outsider'),
    'role', 'authenticated'
  )::text,
  true
);

select throws_ok(
  format($$select * from public.redeem_invite(%L)$$, (select token from expired_invite)),
  '22023',
  null,
  'expired invite cannot be redeemed'
);

select throws_ok(
  format($$select * from public.redeem_invite(%L)$$, (select token from revoked_invite)),
  '22023',
  null,
  'revoked invite cannot be redeemed'
);

select lives_ok(
  format($$select * from public.redeem_invite(%L)$$, (select token from exhausted_invite)),
  'first use of a max-1 invite succeeds'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'outsider-2'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'outsider-2'),
    'role', 'authenticated'
  )::text,
  true
);

select throws_ok(
  format($$select * from public.redeem_invite(%L)$$, (select token from exhausted_invite)),
  '22023',
  null,
  'exhausted invite cannot be redeemed by a second user'
);

select throws_ok(
  $$insert into public.titles (media_type, name, importance, release_order)
    values ('movie', 'Illicit Title', 'optional', 9999)$$,
  '42501',
  null,
  'authenticated clients cannot insert titles'
);

select is(
  (select name from public.titles where id = 'aa000000-0000-4000-8000-000000000001'),
  'Iron Man',
  'catalog seed includes Iron Man with a stable id'
);

select ok(
  not exists (
    select 1
    from public.titles
    where doomsday_order is not null
    group by doomsday_order
    having count(*) > 1
  ),
  'doomsday_order values are unique when present'
);

select is(
  (select doomsday_order from public.titles where id = 'aa000000-0000-4000-8000-000000000005'),
  1,
  'doomsday order starts with Captain America: The First Avenger'
);

select is(
  (select era from public.titles where id = 'aa000000-0000-4000-8000-000000000005'),
  'Legacy: WWII & The 1940s',
  'era labels group wartime titles together'
);

select is(
  (select count(*)::integer from public.titles where doomsday_order is not null),
  62,
  'doomsday path has 62 full titles'
);

select is(
  (select count(*)::integer from public.titles where poster_path is null or poster_path not like '/%'),
  0,
  'every catalog title stores a TMDB poster path'
);

select is(
  (select count(*)::integer from public.titles where backdrop_path is null or backdrop_path not like '/%'),
  0,
  'every catalog title stores a TMDB backdrop path'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'member-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'member-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format(
    $$update public.groups set timezone = 'UTC' where id = %L$$,
    (select id from test_groups where label = 'alpha')
  ),
  'non-owner group update is silently skipped by RLS'
);

select is(
  (
    select timezone
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  'America/Toronto',
  'group timezone is unchanged after a non-owner update'
);

select lives_ok(
  format(
    $$delete from public.groups where id = %L$$,
    (select id from test_groups where label = 'alpha')
  ),
  'non-owner group delete is silently skipped by RLS'
);

select is(
  (
    select count(*)::integer
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  1,
  'non-owner cannot delete a group'
);

select lives_ok(
  format(
    $$delete from public.group_members
      where group_id = %L
        and user_id = %L$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'owner-a')
  ),
  'member removal of another member is silently skipped by RLS'
);

select is(
  (
    select count(*)::integer
    from public.group_members
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'owner-a')
  ),
  1,
  'members cannot remove other members'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format(
    $$update public.groups
      set timezone = 'America/Vancouver',
          target_date = timestamptz '2026-12-18 00:00:00-08'
      where id = %L$$,
    (select id from test_groups where label = 'alpha')
  ),
  'owner can change timezone and target date'
);

select is(
  (
    select timezone
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  'America/Vancouver',
  'owner timezone update persists'
);

select throws_ok(
  format($$select public.leave_group(%L)$$, (select id from test_groups where label = 'alpha')),
  '42501',
  null,
  'owner cannot leave without transferring or deleting'
);

select lives_ok(
  format(
    $$delete from public.group_members
      where group_id = %L
        and user_id = %L$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'owner-a')
  ),
  'owner self-removal is silently skipped by RLS'
);

select is(
  (
    select count(*)::integer
    from public.group_members
    where group_id = (select id from test_groups where label = 'alpha')
      and user_id = (select id from test_users where label = 'owner-a')
      and role = 'owner'
  ),
  1,
  'owner cannot remove their own membership'
);

create temp table extra_invite as
select * from public.create_invite(
  (select id from test_groups where label = 'alpha'),
  now() + interval '7 days',
  1
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'outsider'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'outsider'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format($$select * from public.redeem_invite(%L)$$, (select token from extra_invite)),
  'outsider can join so the owner can test removal'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format(
    $$delete from public.group_members
      where group_id = %L
        and user_id = %L$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'outsider')
  ),
  'owner can remove a member'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'outsider'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'outsider'),
    'role', 'authenticated'
  )::text,
  true
);

select is(
  (
    select count(*)::integer
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  0,
  'removed members immediately lose group access'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'owner-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'owner-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format(
    $$select public.transfer_ownership(%L, %L)$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'owner can transfer ownership to a member'
);

select is(
  (
    select owner_id = (select id from test_users where label = 'member-a')
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  true,
  'groups.owner_id matches transferred owner'
);

select lives_ok(
  format($$select public.leave_group(%L)$$, (select id from test_groups where label = 'alpha')),
  'former owner can leave after transferring'
);

select is(
  (
    select count(*)::integer
    from public.groups
    where id = (select id from test_groups where label = 'alpha')
  ),
  0,
  'members who leave immediately lose group access'
);

select set_config('request.jwt.claim.sub', (select id::text from test_users where label = 'member-a'), true);
select set_config(
  'request.jwt.claims',
  json_build_object(
    'sub', (select id::text from test_users where label = 'member-a'),
    'role', 'authenticated'
  )::text,
  true
);

select lives_ok(
  format($$delete from public.groups where id = %L$$, (select id from test_groups where label = 'alpha')),
  'owner can delete the group'
);

select * from finish();
rollback;
