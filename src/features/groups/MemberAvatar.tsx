import { useEffect, useId, useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ProfileIcon } from '@/features/auth/ProfileIcon'
import { parseAvatarIconId } from '@/features/auth/profile-icons'
import { MemberName } from '@/features/groups/MemberName'
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
  /** Show display name on hover (desktop) and press (touch / PWA). Default true. */
  showNameTooltip?: boolean
}

function memberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? '').join('')

  return letters || '?'
}

function MemberAvatarFace({
  member,
  size,
  highlightOwner,
  className,
}: Omit<MemberAvatarProps, 'showNameTooltip'>) {
  const isOwner = Boolean(highlightOwner && member.role === 'owner')
  const iconId = parseAvatarIconId(member.avatar_url)
  const framed = Boolean(highlightOwner)

  return (
    <span
      className={cn(
        'box-border inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        SIZE_CLASS[size ?? 'xs'],
        framed && 'border-2',
        framed && (isOwner ? 'border-gold' : 'border-border'),
        className,
      )}
    >
      {iconId ? (
        <ProfileIcon
          id={iconId}
          size={size ?? 'xs'}
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
            SIZE_CLASS[size ?? 'xs'],
            'justify-center rounded-full px-0 text-xs',
          )}
        >
          {memberInitials(member.display_name)}
        </span>
      )}
    </span>
  )
}

export function MemberAvatar({
  member,
  size = 'xs',
  highlightOwner = false,
  className,
  showNameTooltip = true,
}: MemberAvatarProps) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const tooltipId = useId()
  const label =
    highlightOwner && member.role === 'owner'
      ? `${member.display_name} (owner)`
      : member.display_name

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const face = (
    <MemberAvatarFace
      member={member}
      size={size}
      highlightOwner={highlightOwner}
      className={className}
    />
  )

  if (!showNameTooltip) {
    return face
  }

  return (
    <TooltipProvider>
      <Tooltip open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            aria-describedby={open ? tooltipId : undefined}
            className="inline-flex shrink-0 rounded-full p-0 leading-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
            onPointerDown={(event) => {
              if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
                return
              }

              if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
              }

              setOpen(true)
            }}
            onPointerUp={(event) => {
              if (event.pointerType !== 'touch' && event.pointerType !== 'pen') {
                return
              }

              if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
              }

              closeTimerRef.current = window.setTimeout(() => {
                setOpen(false)
                closeTimerRef.current = null
              }, 1600)
            }}
            onPointerCancel={() => {
              if (closeTimerRef.current !== null) {
                window.clearTimeout(closeTimerRef.current)
                closeTimerRef.current = null
              }
              setOpen(false)
            }}
          >
            {face}
          </button>
        </TooltipTrigger>
        <TooltipContent id={tooltipId} className="px-2.5 py-1.5" side="top">
          <MemberName>{member.display_name}</MemberName>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
