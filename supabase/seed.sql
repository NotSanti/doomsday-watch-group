-- Fictional development seed only. Real MCU catalog lands in Milestone 6.
-- Do not scrape third-party watchlist sites.

insert into public.titles (
  id,
  tmdb_id,
  media_type,
  name,
  release_date,
  runtime_minutes,
  importance,
  release_order,
  doomsday_order,
  is_active,
  synopsis
) values
  (
    '11111111-1111-1111-1111-111111111111',
    null,
    'movie',
    'Starlight Protocol',
    '2008-05-02',
    126,
    'essential',
    1,
    1,
    true,
    'A test-only origin story used for local development.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    null,
    'series',
    'The Last Beacon',
    '2013-09-24',
    null,
    'recommended',
    2,
    2,
    true,
    'A test-only series treated as one title, not per episode.'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    null,
    'special',
    'Void Harbor One-Shot',
    '2015-11-25',
    45,
    'optional',
    3,
    3,
    true,
    'A test-only special used to exercise filters and ratings.'
  );
