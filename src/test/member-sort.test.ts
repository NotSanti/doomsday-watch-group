import { describe, expect, it } from 'vitest'
import type { GroupMember } from '@/features/groups/group-schemas'
import { sortGroupMembers } from '@/features/members/member-sort'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import type { TitleRow } from '@/features/watchlist/title-schemas'

const GROUP = '22222222-2222-4222-8222-222222222222'
const OWNER = '11111111-1111-4111-8111-111111111111'
const MEMBER = '55555555-5555-4555-8555-555555555555'
const IRON = 'aa000000-0000-4000-8000-000000000001'
const WANDA = 'aa000000-0000-4000-8000-000000000002'

const members: GroupMember[] = [
  {
    group_id: GROUP,
    user_id: OWNER,
    role: 'owner',
    joined_at: '2026-01-01T00:00:00.000Z',
    display_name: 'Owner A',
  },
  {
    group_id: GROUP,
    user_id: MEMBER,
    role: 'member',
    joined_at: '2026-02-01T00:00:00.000Z',
    display_name: 'Member B',
  },
]

const titles = [
  { id: IRON, name: 'Iron Man', is_active: true },
  { id: WANDA, name: 'WandaVision', is_active: true },
] as TitleRow[]

const progress: GroupProgressRow[] = [
  {
    group_id: GROUP,
    user_id: MEMBER,
    title_id: IRON,
    status: 'watched',
    started_at: '2026-03-01T00:00:00.000Z',
    watched_at: '2026-04-01T00:00:00.000Z',
  },
  {
    group_id: GROUP,
    user_id: OWNER,
    title_id: IRON,
    status: 'watching',
    started_at: '2026-03-15T00:00:00.000Z',
    watched_at: null,
  },
]

describe('member sort', () => {
  it('sorts by completion, recent activity, and name', () => {
    expect(
      sortGroupMembers(members, titles, progress, 'completion').map(
        (member) => member.display_name,
      ),
    ).toEqual(['Member B', 'Owner A'])
    expect(
      sortGroupMembers(members, titles, progress, 'recent').map(
        (member) => member.display_name,
      ),
    ).toEqual(['Member B', 'Owner A'])
    expect(
      sortGroupMembers(members, titles, progress, 'name').map(
        (member) => member.display_name,
      ),
    ).toEqual(['Member B', 'Owner A'])
  })
})
