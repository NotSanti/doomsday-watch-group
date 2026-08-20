import { z } from 'zod'

export const AVATAR_ICON_PREFIX = 'icon:'

export const PROFILE_ICON_IDS = [
  'iron-man',
  'captain-america',
  'thor',
  'hulk',
  'black-widow',
  'hawkeye',
  'spider-man',
  'doctor-strange',
  'scarlet-witch',
  'black-panther',
  'captain-marvel',
  'ant-man',
  'falcon',
  'winter-soldier',
  'vision',
  'loki',
  'moon-knight',
  'shang-chi',
  'fantastic-four',
  'doctor-doom',
  'deadpool',
  'wolverine',
  'magneto',
  'sentry',
] as const

export type ProfileIconId = (typeof PROFILE_ICON_IDS)[number]

export const profileIconIdSchema = z.enum(PROFILE_ICON_IDS)

export const PROFILE_ICONS: ReadonlyArray<{
  id: ProfileIconId
  label: string
}> = PROFILE_ICON_IDS.map((id) => ({
  id,
  label: id
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' '),
}))

export function profileIconSrc(iconId: ProfileIconId): string {
  return `/profile-icons/${iconId}.svg`
}

export function toAvatarUrl(iconId: ProfileIconId): string {
  return `${AVATAR_ICON_PREFIX}${iconId}`
}

export function parseAvatarIconId(
  avatarUrl: string | null | undefined,
): ProfileIconId | null {
  if (!avatarUrl?.startsWith(AVATAR_ICON_PREFIX)) {
    return null
  }

  const parsed = profileIconIdSchema.safeParse(
    avatarUrl.slice(AVATAR_ICON_PREFIX.length),
  )

  return parsed.success ? parsed.data : null
}

export function isMissingProfileIcon(
  avatarUrl: string | null | undefined,
): boolean {
  return parseAvatarIconId(avatarUrl) === null
}
