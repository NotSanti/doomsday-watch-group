import {
  OTHER_ERA_LABEL,
  groupTitlesByEra,
} from '@/features/watchlist/title-groups'
import type { TitleRow } from '@/features/watchlist/title-schemas'

const ironMan = {
  id: 'aa000000-0000-4000-8000-000000000001',
  tmdb_id: 1726,
  media_type: 'movie',
  name: 'Iron Man',
  release_date: '2008-05-02',
  runtime_minutes: 126,
  episode_count: null,
  poster_path: null,
  backdrop_path: null,
  synopsis: null,
  phase: 1,
  saga: 'Infinity Saga',
  era: 'Phase 1 — The Avengers Initiative (2008–2012)',
  importance: 'essential',
  release_order: 1,
  doomsday_order: 3,
  is_active: true,
} satisfies TitleRow

const firstAvenger = {
  ...ironMan,
  id: 'aa000000-0000-4000-8000-000000000005',
  name: 'Captain America: The First Avenger',
  era: 'Legacy: WWII & The 1940s',
  doomsday_order: 1,
} satisfies TitleRow

const agentCarter = {
  ...firstAvenger,
  id: 'aa000000-0000-4000-8000-000000000030',
  name: 'Agent Carter',
  media_type: 'series',
  doomsday_order: 3,
} satisfies TitleRow

const uncategorized = {
  ...ironMan,
  id: 'aa000000-0000-4000-8000-000000000040',
  name: 'Eternals',
  era: null,
  doomsday_order: null,
} satisfies TitleRow

describe('groupTitlesByEra', () => {
  it('inserts a header group when the era changes', () => {
    expect(
      groupTitlesByEra([firstAvenger, agentCarter, ironMan]).map((group) => ({
        era: group.era,
        names: group.titles.map((title) => title.name),
      })),
    ).toEqual([
      {
        era: 'Legacy: WWII & The 1940s',
        names: ['Captain America: The First Avenger', 'Agent Carter'],
      },
      {
        era: 'Phase 1 — The Avengers Initiative (2008–2012)',
        names: ['Iron Man'],
      },
    ])
  })

  it('uses a fallback label when era is missing', () => {
    expect(groupTitlesByEra([uncategorized])[0]?.era).toBe(OTHER_ERA_LABEL)
  })
})
