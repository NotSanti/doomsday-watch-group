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
  const framed = highlightOwner

  return (
    <span
      className={cn(
        'box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        SIZE_CLASS[size],
        framed && 'border-2',
        framed && (isOwner ? 'border-gold' : 'border-border'),
        className,
      )}
    >
      {iconId ? (
        <ProfileIcon
          id={iconId}
          size={size}
          className="block size-full rounded-full object-cover"
        />
      ) : framed ? (
        <span
          aria-hidden="true"
          className={cn(
            'flex size-full items-center justify-center text-xs font-medium',
            isOwner
              ? 'bg-chip-gold-bg text-chip-gold-fg'
              : 'bg-chip-metal-bg text-chip-metal-fg',
          )}
        >
          {memberInitials(member.display_name)}
        </span>
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
