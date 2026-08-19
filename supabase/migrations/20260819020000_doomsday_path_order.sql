-- Align doomsday_order with the public Prepare for Doomsday viewing sequence.
-- Titles and order only. Credit-scene stubs are omitted; each film stays one catalog row.
-- Off-path titles remain active with a null doomsday_order so release order still lists them.

update public.titles set doomsday_order = null;

insert into public.titles (
  id, tmdb_id, media_type, name, release_date, runtime_minutes, episode_count,
  poster_path, backdrop_path, synopsis, phase, saga, importance,
  release_order, doomsday_order, is_active
) values
(
  'aa000000-0000-4000-8000-00000000002f',
  211387,
  'special',
  'Marvel One-Shot: Agent Carter',
  '2013-09-24',
  15,
  null,
  null,
  null,
  $$Peggy Carter runs a postwar mission the official channels would rather pretend never happened.$$,
  1,
  'Infinity Saga',
  'essential',
  1000,
  2,
  true
),
(
  'aa000000-0000-4000-8000-000000000030',
  61550,
  'series',
  'Agent Carter',
  '2015-01-06',
  null,
  8,
  null,
  null,
  $$Peggy Carter builds a spy career in a New York that still underestimates her.$$,
  1,
  'Infinity Saga',
  'essential',
  1001,
  3,
  true
),
(
  'aa000000-0000-4000-8000-000000000031',
  61550,
  'series',
  'Agent Carter (Season 2)',
  '2016-01-19',
  null,
  10,
  null,
  null,
  $$A West Coast case pulls Peggy back into leftover secrets from the war.$$,
  1,
  'Infinity Saga',
  'essential',
  1002,
  4,
  true
),
(
  'aa000000-0000-4000-8000-000000000032',
  49538,
  'movie',
  'X-Men: First Class',
  '2011-06-03',
  132,
  null,
  null,
  null,
  $$Young mutants choose sides as a Cuban Missile Crisis conspiracy unfolds.$$,
  null,
  'X-Men films',
  'recommended',
  1003,
  5,
  true
),
(
  'aa000000-0000-4000-8000-000000000033',
  36657,
  'movie',
  'X-Men',
  '2000-07-14',
  104,
  null,
  null,
  null,
  $$A hidden community of mutants steps into public view to stop one of their own.$$,
  null,
  'X-Men films',
  'recommended',
  1004,
  6,
  true
),
(
  'aa000000-0000-4000-8000-000000000034',
  36658,
  'movie',
  'X2: X-Men United',
  '2003-05-02',
  134,
  null,
  null,
  null,
  $$A government plot forces old enemies to share a fight for survival.$$,
  null,
  'X-Men films',
  'recommended',
  1005,
  7,
  true
),
(
  'aa000000-0000-4000-8000-000000000035',
  36668,
  'movie',
  'X-Men: The Last Stand',
  '2006-05-26',
  104,
  null,
  null,
  null,
  $$A promised cure splits mutants over what they are willing to give up.$$,
  null,
  'X-Men films',
  'recommended',
  1006,
  8,
  true
),
(
  'aa000000-0000-4000-8000-000000000036',
  76170,
  'movie',
  'The Wolverine',
  '2013-07-26',
  126,
  null,
  null,
  null,
  $$Logan seeks quiet in Japan and finds a fight he cannot walk away from.$$,
  null,
  'X-Men films',
  'recommended',
  1007,
  9,
  true
),
(
  'aa000000-0000-4000-8000-000000000037',
  127585,
  'movie',
  'X-Men: Days of Future Past',
  '2014-05-23',
  132,
  null,
  null,
  null,
  $$Two timelines hinge on a single choice in 1973.$$,
  null,
  'X-Men films',
  'recommended',
  1008,
  10,
  true
),
(
  'aa000000-0000-4000-8000-000000000038',
  246655,
  'movie',
  'X-Men: Apocalypse',
  '2016-05-27',
  144,
  null,
  null,
  null,
  $$The first mutant tries to rebuild the world; a new generation stands up.$$,
  null,
  'X-Men films',
  'recommended',
  1009,
  11,
  true
),
(
  'aa000000-0000-4000-8000-000000000039',
  320288,
  'movie',
  'Dark Phoenix',
  '2019-06-07',
  113,
  null,
  null,
  null,
  $$Jean Grey's power outruns every safeguard the X-Men have left.$$,
  null,
  'X-Men films',
  'recommended',
  1010,
  12,
  true
),
(
  'aa000000-0000-4000-8000-00000000003a',
  413279,
  'special',
  'Team Thor',
  '2016-08-28',
  4,
  null,
  null,
  null,
  $$Thor crash-lands in a civilian apartment and tries to explain the Avengers.$$,
  3,
  'Infinity Saga',
  'optional',
  1011,
  27,
  true
),
(
  'aa000000-0000-4000-8000-00000000003b',
  441829,
  'special',
  'Team Thor: Part 2',
  '2017-02-28',
  5,
  null,
  null,
  null,
  $$Thor's roommate situation does not improve.$$,
  3,
  'Infinity Saga',
  'optional',
  1012,
  28,
  true
),
(
  'aa000000-0000-4000-8000-00000000003c',
  293660,
  'movie',
  'Deadpool',
  '2016-02-12',
  108,
  null,
  null,
  null,
  $$A mercenary with a ruined body goes after the man who made him.$$,
  null,
  'X-Men films',
  'essential',
  1013,
  33,
  true
),
(
  'aa000000-0000-4000-8000-00000000003d',
  383498,
  'movie',
  'Deadpool 2',
  '2018-05-18',
  119,
  null,
  null,
  null,
  $$Wade builds a messy team to stop a future that already went wrong.$$,
  null,
  'X-Men films',
  'essential',
  1014,
  34,
  true
),
(
  'aa000000-0000-4000-8000-00000000003e',
  505945,
  'special',
  'Team Darryl',
  '2018-03-06',
  6,
  null,
  null,
  null,
  $$Darryl's new Asgardian roommate is even worse at chores.$$,
  3,
  'Infinity Saga',
  'optional',
  1015,
  36,
  true
),
(
  'aa000000-0000-4000-8000-00000000003f',
  263115,
  'movie',
  'Logan',
  '2017-03-03',
  137,
  null,
  null,
  null,
  $$An aging Wolverine protects a child whose power could restart everything.$$,
  null,
  'X-Men films',
  'recommended',
  1016,
  39,
  true
),
(
  'aa000000-0000-4000-8000-000000000040',
  88329,
  'series',
  'Hawkeye',
  '2021-11-24',
  null,
  6,
  null,
  null,
  $$Clint Barton tries to spend the holidays with his family and inherits a city-sized mess.$$,
  4,
  'Multiverse Saga',
  'essential',
  1017,
  46,
  true
),
(
  'aa000000-0000-4000-8000-000000000041',
  92782,
  'series',
  'Ms. Marvel',
  '2022-06-08',
  null,
  6,
  null,
  null,
  $$A Jersey City teenager writes herself into a much bigger story.$$,
  4,
  'Multiverse Saga',
  'recommended',
  1018,
  50,
  true
),
(
  'aa000000-0000-4000-8000-000000000042',
  138505,
  'series',
  'Marvel Zombies',
  '2025-09-24',
  null,
  4,
  null,
  null,
  $$A what-if outbreak turns familiar heroes into something hungry.$$,
  5,
  'Multiverse Saga',
  'optional',
  1019,
  55,
  true
),
(
  'aa000000-0000-4000-8000-000000000043',
  84958,
  'series',
  'Loki (Season 2)',
  '2023-10-06',
  null,
  6,
  null,
  null,
  $$The TVA's time-slipping problem gets worse before it gets clearer.$$,
  5,
  'Multiverse Saga',
  'essential',
  1020,
  56,
  true
),
(
  'aa000000-0000-4000-8000-000000000044',
  969681,
  'movie',
  'Spider-Man: Brand New Day',
  '2026-07-31',
  null,
  null,
  null,
  null,
  $$Peter Parker tries for an ordinary life that the city will not allow.$$,
  6,
  'Multiverse Saga',
  'recommended',
  1021,
  60,
  true
);

update public.titles
set doomsday_order = 1,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000005';

update public.titles
set doomsday_order = 13,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000015';

update public.titles
set doomsday_order = 14,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000001';

update public.titles
set doomsday_order = 15,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000002';

update public.titles
set doomsday_order = 16,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000003';

update public.titles
set doomsday_order = 17,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000004';

update public.titles
set doomsday_order = 18,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000006';

update public.titles
set doomsday_order = 19,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000007';

update public.titles
set doomsday_order = 20,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000008';

update public.titles
set doomsday_order = 21,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000009';

update public.titles
set doomsday_order = 22,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000000a';

update public.titles
set doomsday_order = 23,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000000f';

update public.titles
set doomsday_order = 24,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000000b';

update public.titles
set doomsday_order = 25,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000000c';

update public.titles
set doomsday_order = 26,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000000d';

update public.titles
set doomsday_order = 29,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000001b';

update public.titles
set doomsday_order = 30,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000012';

update public.titles
set doomsday_order = 31,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000010';

update public.titles
set doomsday_order = 32,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000000e';

update public.titles
set doomsday_order = 35,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000011';

update public.titles
set doomsday_order = 37,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000014';

update public.titles
set doomsday_order = 38,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000013';

update public.titles
set doomsday_order = 40,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000016';

update public.titles
set doomsday_order = 41,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000018';

update public.titles
set doomsday_order = 42,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000019';

update public.titles
set doomsday_order = 43,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000001a';

update public.titles
set doomsday_order = 44,
    importance = 'optional'
where id = 'aa000000-0000-4000-8000-00000000001c';

update public.titles
set doomsday_order = 45,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000017';

update public.titles
set doomsday_order = 47,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000001d';

update public.titles
set doomsday_order = 48,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000001f';

update public.titles
set doomsday_order = 49,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000020';

update public.titles
set doomsday_order = 51,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000021';

update public.titles
set doomsday_order = 52,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000023';

update public.titles
set doomsday_order = 53,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000025';

update public.titles
set doomsday_order = 54,
    importance = 'recommended'
where id = 'aa000000-0000-4000-8000-000000000027';

update public.titles
set doomsday_order = 57,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000028';

update public.titles
set doomsday_order = 58,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-000000000029';

update public.titles
set doomsday_order = 59,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000002a';

update public.titles
set doomsday_order = 61,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000002b';

update public.titles
set doomsday_order = 62,
    importance = 'essential'
where id = 'aa000000-0000-4000-8000-00000000002c';

update public.titles set release_order = release_order + 100000;

update public.titles as t
set release_order = s.rn
from (
  select id, row_number() over (order by release_date nulls last, name) as rn
  from public.titles
) as s
where t.id = s.id;
