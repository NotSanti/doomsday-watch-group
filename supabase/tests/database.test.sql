begin;
select plan(26);

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
  'raw invite token is not stored'
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
      values (%L, %L, '11111111-1111-1111-1111-111111111111', 'watching')$$,
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
      values (%L, %L, '11111111-1111-1111-1111-111111111111', 'watching', now())$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can insert own progress'
);

select throws_ok(
  format(
    $$insert into public.member_title_progress (group_id, user_id, title_id, status)
      values (%L, %L, '22222222-2222-2222-2222-222222222222', 'watching')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'owner-a')
  ),
  '42501',
  null,
  'member cannot insert progress for another user'
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
      values (%L, %L, '11111111-1111-1111-1111-111111111111', 8.5, 'Solid')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  'member can create a review'
);

select throws_ok(
  format(
    $$insert into public.reviews (group_id, user_id, title_id, rating)
      values (%L, %L, '11111111-1111-1111-1111-111111111111', 9.0)$$,
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
      values (%L, %L, '22222222-2222-2222-2222-222222222222', 8.3)$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  '23514',
  null,
  'ratings not in 0.5 increments are rejected'
);

select throws_ok(
  format(
    $$insert into public.activity_events (group_id, actor_id, event_type)
      values (%L, %L, 'joined')$$,
    (select id from test_groups where label = 'alpha'),
    (select id from test_users where label = 'member-a')
  ),
  '42501',
  null,
  'clients cannot insert activity events'
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
    values ('movie', 'Illicit Title', 'optional', 99)$$,
  '42501',
  null,
  'authenticated clients cannot insert titles'
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
    where name = 'Alpha Watch'
  ),
  true,
  'groups.owner_id matches transferred owner'
);

select * from finish();
rollback;
