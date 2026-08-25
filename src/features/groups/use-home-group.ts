import { useEffect, useState } from 'react'
import {
  maybeAutoSelectSingleGroup,
  readHomeGroupPreference,
  resolveActiveHomeGroupId,
  toggleHomeGroupPreference,
  writeHomeGroupPreference,
  type HomeGroupPreference,
} from '@/features/groups/home-group'

export function useHomeGroupPreference(
  userId: string,
  groupIds: readonly string[],
  options?: { autoSelectSingle?: boolean },
) {
  const autoSelectSingle = options?.autoSelectSingle ?? true
  const [override, setOverride] = useState<HomeGroupPreference | null>(null)

  useEffect(() => {
    setOverride(null)
  }, [userId])

  const stored = userId ? readHomeGroupPreference(userId) : { kind: 'unset' as const }
  const base = override ?? stored
  const preference = autoSelectSingle
    ? maybeAutoSelectSingleGroup(groupIds, base)
    : base
  const homeGroupId = resolveActiveHomeGroupId(groupIds, preference)

  useEffect(() => {
    if (!userId) {
      return
    }

    if (stored.kind === 'unset' && preference.kind === 'group') {
      writeHomeGroupPreference(userId, preference)
    }
  }, [preference, stored.kind, userId])

  function setHomeGroup(groupId: string): void {
    const next = toggleHomeGroupPreference(preference, groupId)
    if (userId) {
      writeHomeGroupPreference(userId, next)
    }
    setOverride(next)
  }

  return { homeGroupId, preference, setHomeGroup }
}
