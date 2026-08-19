import type { QueryClient } from '@tanstack/react-query'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { BrowserSupabaseClient } from '@/lib/supabase'

export const REALTIME_INVALIDATION_DEBOUNCE_MS = 150

const pendingInvalidations = new Map<
  string,
  ReturnType<typeof setTimeout>
>()
const activeChannels = new Set<RealtimeChannel>()

function invalidationKey(queryKey: readonly unknown[]): string {
  return JSON.stringify(queryKey)
}

export function scheduleQueryInvalidation(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  delayMs = REALTIME_INVALIDATION_DEBOUNCE_MS,
): void {
  const key = invalidationKey(queryKey)
  const existing = pendingInvalidations.get(key)

  if (existing) {
    clearTimeout(existing)
  }

  const timeout = setTimeout(() => {
    pendingInvalidations.delete(key)
    void queryClient.invalidateQueries({ queryKey })
  }, delayMs)

  pendingInvalidations.set(key, timeout)
}

export function cancelScheduledInvalidations(): void {
  for (const timeout of pendingInvalidations.values()) {
    clearTimeout(timeout)
  }

  pendingInvalidations.clear()
}

export function registerRealtimeChannel(channel: RealtimeChannel): void {
  activeChannels.add(channel)
}

export function unregisterRealtimeChannel(channel: RealtimeChannel): void {
  activeChannels.delete(channel)
}

export async function removeAllRealtimeChannels(
  client: BrowserSupabaseClient,
): Promise<void> {
  cancelScheduledInvalidations()

  const channels = [...activeChannels]
  activeChannels.clear()

  await Promise.all(channels.map((channel) => client.removeChannel(channel)))
}

export function activeRealtimeChannelCount(): number {
  return activeChannels.size
}
