import { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  cancelScheduledInvalidations,
  REALTIME_INVALIDATION_DEBOUNCE_MS,
  scheduleQueryInvalidation,
} from '@/lib/realtime'

describe('scheduleQueryInvalidation', () => {
  afterEach(() => {
    vi.useRealTimers()
    cancelScheduledInvalidations()
  })

  it('debounces repeated invalidations for the same query key', () => {
    vi.useFakeTimers()
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    scheduleQueryInvalidation(queryClient, ['progress', 'group', 'abc'])
    scheduleQueryInvalidation(queryClient, ['progress', 'group', 'abc'])
    scheduleQueryInvalidation(queryClient, ['progress', 'group', 'abc'])

    expect(invalidateSpy).not.toHaveBeenCalled()

    vi.advanceTimersByTime(REALTIME_INVALIDATION_DEBOUNCE_MS)

    expect(invalidateSpy).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['progress', 'group', 'abc'],
    })
  })

  it('invalidates different query keys independently', () => {
    vi.useFakeTimers()
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    scheduleQueryInvalidation(queryClient, ['progress', 'group', 'abc'])
    scheduleQueryInvalidation(queryClient, ['reviews', 'group', 'abc'])

    vi.advanceTimersByTime(REALTIME_INVALIDATION_DEBOUNCE_MS)

    expect(invalidateSpy).toHaveBeenCalledTimes(2)
  })
})
