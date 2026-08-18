-- Doomsday Watch Group — core schema
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 60),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.titles (
  id uuid primary key default gen_random_uuid(),
  tmdb_id integer,
  media_type text not null check (media_type in ('movie', 'series', 'special')),
  name text not null,
  release_date date,
  runtime_minutes integer check (runtime_minutes is null or runtime_minutes > 0),
  episode_count integer check (episode_count is null or episode_count > 0),
  poster_path text,
  backdrop_path text,
  synopsis text,
  phase integer,
  saga text,
  importance text not null check (importance in ('essential', 'recommended', 'optional')),
  release_order integer not null unique,
  doomsday_order integer unique,
  is_active boolean not null default true,
  metadata_updated_at timestamptz
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 3 and 60),
  description text check (description is null or char_length(description) <= 280),
  owner_id uuid not null references public.profiles (id),
  current_title_id uuid references public.titles (id),
  target_date timestamptz not null,
  timezone text not null default 'America/Toronto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create unique index group_members_one_owner
  on public.group_members (group_id)
  where role = 'owner';

create table public.group_invites (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references public.profiles (id),
  expires_at timestamptz,
  max_uses integer check (max_uses is null or max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.member_title_progress (
  group_id uuid not null,
  user_id uuid not null,
  title_id uuid not null references public.titles (id),
  status text not null check (status in ('not_started', 'watching', 'watched')),
  started_at timestamptz,
  watched_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (group_id, user_id, title_id),
  foreign key (group_id, user_id) references public.group_members (group_id, user_id) on delete cascade
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null,
  user_id uuid not null,
  title_id uuid not null references public.titles (id),
  rating numeric(3, 1) not null
    check (rating >= 1 and rating <= 10 and rating * 2 = floor(rating * 2)),
  body text check (body is null or char_length(body) <= 2000),
  contains_spoilers boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, user_id, title_id),
  foreign key (group_id, user_id) references public.group_members (group_id, user_id) on delete cascade
);

create table public.activity_events (
  id bigint generated always as identity primary key,
  group_id uuid not null references public.groups (id) on delete cascade,
  actor_id uuid not null references public.profiles (id),
  event_type text not null check (
    event_type in ('joined', 'started', 'completed', 'rated', 'reviewed')
  ),
  title_id uuid references public.titles (id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index group_members_user_id_idx on public.group_members (user_id);
create index group_invites_group_id_idx on public.group_invites (group_id);
create index member_title_progress_group_id_idx on public.member_title_progress (group_id);
create index reviews_group_title_idx on public.reviews (group_id, title_id);
create index activity_events_group_created_idx on public.activity_events (group_id, created_at desc);
create index titles_active_doomsday_idx on public.titles (doomsday_order) where is_active;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger groups_set_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create trigger member_title_progress_set_updated_at
  before update on public.member_title_progress
  for each row execute function public.set_updated_at();

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'New member')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
