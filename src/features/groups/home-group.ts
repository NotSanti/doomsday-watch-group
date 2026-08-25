import { z } from 'zod'
import { groupIdSchema } from '@/features/groups/group-schemas'

export const GROUPS_LIST_NAV_STATE = { source: 'groups-nav' } as const

const homeGroupStoredSchema = z.union([z.literal('none'), groupIdSchema])

export type HomeGroupPreference =
  | { kind: 'unset' }
  | { kind: 'none' }
  | { kind: 'group'; id: string }

function storageKey(userId: string): string {
  return `doomsday:home-group:${userId}`
}

export function isGroupsListNavState(state: unknown): boolean {
  return (
    typeof state === 'object' &&
    state !== null &&
    'source' in state &&
    state.source === GROUPS_LIST_NAV_STATE.source
  )
}

export function readHomeGroupPreference(userId: string): HomeGroupPreference {
  if (!userId || typeof localStorage === 'undefined') {
    return { kind: 'unset' }
  }

  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (raw === null) {
      return { kind: 'unset' }
    }

    const parsed = homeGroupStoredSchema.safeParse(raw)
    if (!parsed.success) {
      return { kind: 'unset' }
    }

    if (parsed.data === 'none') {
      return { kind: 'none' }
    }

    return { kind: 'group', id: parsed.data }
  } catch {
    return { kind: 'unset' }
  }
}

export function writeHomeGroupPreference(
  userId: string,
  preference: HomeGroupPreference,
): void {
  if (!userId || typeof localStorage === 'undefined') {
    return
  }

  try {
    if (preference.kind === 'unset') {
      localStorage.removeItem(storageKey(userId))
      return
    }

    localStorage.setItem(
      storageKey(userId),
      preference.kind === 'none' ? 'none' : preference.id,
    )
  } catch {
    // Ignore quota / private-mode failures; the in-memory UI still updates.
  }
}

export function maybeAutoSelectSingleGroup(
  groupIds: readonly string[],
  preference: HomeGroupPreference,
): HomeGroupPreference {
  if (preference.kind !== 'unset' || groupIds.length !== 1) {
    return preference
  }

  const id = groupIds[0]
  if (!id) {
    return preference
  }

  return { kind: 'group', id }
}

export function resolveActiveHomeGroupId(
  groupIds: readonly string[],
  preference: HomeGroupPreference,
): string | null {
  if (preference.kind !== 'group') {
    return null
  }

  return groupIds.includes(preference.id) ? preference.id : null
}

export function toggleHomeGroupPreference(
  preference: HomeGroupPreference,
  groupId: string,
): HomeGroupPreference {
  if (preference.kind === 'group' && preference.id === groupId) {
    return { kind: 'none' }
  }

  return { kind: 'group', id: groupId }
}
