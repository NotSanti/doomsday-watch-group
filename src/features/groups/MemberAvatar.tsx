import { ProfileIcon } from '@/features/auth/ProfileIcon'
import { parseAvatarIconId } from '@/features/auth/profile-icons'
import type { GroupMember } from '@/features/groups/group-schemas'
import { chipClasses } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

const SIZE_CLASS = {
  xs: 'size-8',
  sm: 'size-10',
} as const

type MemberAvatarProps = {
  member: Pick<GroupMember, 'display_name' | 'avatar_url' | 'role'>
  size?: keyof typeof SIZE_CLASS
  highlightOwner?: boolean
  className?: string
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')

  return letters || '?'
}

export function MemberAvatar({
  member,
  size = 'xs',
  highlightOwner = false,
  className,
}: MemberAvatarProps) {
  const isOwner = highlightOwner && member.role === 'owner'
  const iconId = parseAvatarIconId(member.avatar_url)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-full',
        isOwner
          ? 'ring-2 ring-gold ring-offset-2 ring-offset-surface-elevated'
          : null,
        className,
      )}
    >
      {iconId ? (
        <ProfileIcon id={iconId} size={size} />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            chipClasses(isOwner ? 'gold' : 'metal', 'pill'),
            SIZE_CLASS[size],
            'justify-center rounded-full px-0 text-xs',
          )}
        >
          {memberInitials(member.display_name)}
        </span>
      )}
    </span>
  )
}
