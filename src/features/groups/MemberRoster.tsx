import { Crown } from 'lucide-react'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
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
