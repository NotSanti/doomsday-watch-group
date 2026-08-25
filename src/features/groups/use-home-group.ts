import { useEffect, useState } from 'react'
import {
  maybeAutoSelectSingleGroup,
  readHomeGroupPreference,
  resolveActiveHomeGroupId,
  toggleHomeGroupPreference,
  writeHomeGroupPreference,
  type HomeGroupPreference,
} from '@/features/groups/home-group'

type HomeGroupOverride = {
  userId: string
  preference: HomeGroupPreference
}

export function useHomeGroupPreference(
  userId: string,
  groupIds: readonly string[],
  options?: { autoSelectSingle?: boolean },
) {
  const autoSelectSingle = options?.autoSelectSingle ?? true
  const [override, setOverride] = useState<HomeGroupOverride | null>(null)
  const stored = userId
    ? readHomeGroupPreference(userId)
    : { kind: 'unset' as const }
  const base = override?.userId === userId ? override.preference : stored
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
    setOverride({ userId, preference: next })
  }

  return { homeGroupId, preference, setHomeGroup }
}
