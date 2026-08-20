import { Crown } from 'lucide-react'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { MemberAvatar } from '@/features/groups/MemberAvatar'
import { toFriendlyGroupMembersError } from '@/features/groups/group-errors'
import type { GroupMember } from '@/features/groups/group-schemas'
import { chipClasses } from '@/lib/chip-styles'
import { cn } from '@/lib/utils'

type MemberRosterProps = {
  members: GroupMember[]
  isPending: boolean
  isError: boolean
  onRetry: () => void
  compact?: boolean
}

export function MemberRoster({
  members,
  isPending,
  isError,
  onRetry,
  compact = false,
}: MemberRosterProps) {
  if (isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading members</span>
        <Skeleton className={cn('w-full', compact ? 'h-8' : 'h-16')} />
      </div>
    )
  }

  if (isError) {
    if (compact) {
      return (
        <p className="text-sm text-danger" role="alert">
          {toFriendlyGroupMembersError()}{' '}
          <button
            type="button"
            className="underline decoration-danger/60 underline-offset-2 hover:text-heading"
            onClick={onRetry}
          >
            Try again
          </button>
        </p>
      )
    }

    return (
      <ErrorState message={toFriendlyGroupMembersError()} onRetry={onRetry} />
    )
  }

  if (members.length === 0) {
    return <p className="text-sm text-muted">No members yet.</p>
  }

  if (compact) {
    return (
      <TooltipProvider>
        <ul className="flex flex-wrap items-center justify-start gap-2">
          {members.map((member) => (
            <li
              key={`${member.group_id}:${member.user_id}`}
              className="flex items-center"
            >
              <MemberIcon member={member} />
            </li>
          ))}
        </ul>
      </TooltipProvider>
    )
  }

  return (
    <ul className="flex flex-wrap items-center justify-start gap-2">
      {members.map((member) => (
        <li key={`${member.group_id}:${member.user_id}`}>
          <MemberPill member={member} />
        </li>
      ))}
    </ul>
  )
}

function MemberIcon({ member }: { member: GroupMember }) {
  const isOwner = member.role === 'owner'
  const label = isOwner
    ? `${member.display_name} (owner)`
    : member.display_name

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="flex size-8 shrink-0 items-center justify-center p-0 leading-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
        >
          <MemberAvatar member={member} highlightOwner />
        </button>
      </TooltipTrigger>
      <TooltipContent className="px-2.5 py-1.5" side="top">
        {member.display_name}
      </TooltipContent>
    </Tooltip>
  )
}

function MemberPill({ member }: { member: GroupMember }) {
  const isOwner = member.role === 'owner'

  return (
    <span
      className={cn(
        chipClasses(isOwner ? 'gold' : 'metal', 'pill'),
        'h-8 gap-1.5 px-2.5 text-sm leading-none',
      )}
    >
      {isOwner ? (
        <Crown className="size-3.5 shrink-0" aria-hidden="true" />
      ) : null}
      <span>{member.display_name}</span>
      {isOwner ? <span className="sr-only"> (owner)</span> : null}
    </span>
  )
}
