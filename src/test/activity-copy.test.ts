import { describe, expect, it } from 'vitest'
import { formatActivityMessage } from '@/features/activity/activity-copy'
import { toActivityEvent } from '@/features/activity/activity-schemas'

const base = {
  id: 1,
  group_id: '22222222-2222-4222-8222-222222222222',
  actor_id: '11111111-1111-4111-8111-111111111111',
  title_id: 'aa000000-0000-4000-8000-000000000001',
  metadata: {},
  created_at: '2026-08-19T00:00:00.000Z',
  profiles: { display_name: 'Owner A' },
  titles: { name: 'Iron Man' },
}

describe('activity copy', () => {
  it('formats join, watch, rating, and review events', () => {
    expect(
      formatActivityMessage(
        toActivityEvent({ ...base, event_type: 'joined', title_id: null, titles: null }),
      ),
    ).toBe('Owner A joined the group')
    expect(
      formatActivityMessage(toActivityEvent({ ...base, event_type: 'started' })),
    ).toBe('Owner A started Iron Man')
    expect(
      formatActivityMessage(toActivityEvent({ ...base, event_type: 'completed' })),
    ).toBe('Owner A watched Iron Man')
    expect(
      formatActivityMessage(
        toActivityEvent({
          ...base,
          event_type: 'rated',
          metadata: { rating: 8.5 },
        }),
      ),
    ).toBe('Owner A rated Iron Man 8.5/10')
    expect(
      formatActivityMessage(toActivityEvent({ ...base, event_type: 'reviewed' })),
    ).toBe('Owner A reviewed Iron Man')
  })
})
