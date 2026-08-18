import { Crown } from 'lucide-react'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { toFriendlyGroupMembersError } from '@/features/groups/group-errors'
import type { GroupMember } from '@/features/groups/group-schemas'
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
    <ul
      className={cn(
        'flex flex-wrap items-center gap-2',
        compact ? 'justify-center' : 'justify-start',
      )}
    >
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
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-sm leading-none',
        isOwner
          ? 'border-accent/40 bg-accent/15 text-heading'
          : 'border-border bg-surface-elevated text-heading',
      )}
    >
      {isOwner ? (
        <Crown className="size-3.5 shrink-0 text-gold" aria-hidden="true" />
      ) : null}
      <span>{member.display_name}</span>
      {isOwner ? <span className="sr-only"> (owner)</span> : null}
    </span>
  )
}
