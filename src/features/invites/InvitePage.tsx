import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/features/auth/use-auth'
import { MemberName } from '@/features/groups/MemberName'
import {
  toFriendlyInvitePreviewError,
  toFriendlyInvitePreviewReason,
  toFriendlyRedeemInviteError,
} from '@/features/invites/invite-errors'
import { invitePath } from '@/features/invites/invite-link'
import {
  useInvitePreview,
  useRedeemInvite,
} from '@/features/invites/use-invites'

function memberCountLabel(count: number | null): string {
  if (count === null) {
    return 'Member count hidden'
  }

  return count === 1 ? '1 member' : `${count} members`
}

export function InvitePage() {
  const { token = '' } = useParams()
  const { status } = useAuth()
  const previewQuery = useInvitePreview(token)
  const redeemInvite = useRedeemInvite(token)
  const [joinError, setJoinError] = useState<string | null>(null)
  const returnTo = invitePath(token)

  if (previewQuery.isPending) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <div role="status" aria-live="polite">
          <span className="sr-only">Checking invite</span>
          <Skeleton className="h-40 w-full" />
        </div>
      </main>
    )
  }

  if (previewQuery.isError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorState
          message={toFriendlyInvitePreviewError()}
          onRetry={() => {
            void previewQuery.refetch()
          }}
        />
      </main>
    )
  }

  const preview = previewQuery.data

  if (!preview?.is_valid) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          title="Join a watch group"
          description={toFriendlyInvitePreviewReason(
            preview?.invalid_reason ?? 'invalid',
          )}
          action={
            <Button asChild variant="secondary">
              <Link to="/invite">Try another invite</Link>
            </Button>
          }
        />
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card>
        <CardTitle>Join a watch group</CardTitle>
        <p className="mt-3 text-heading">{preview.group_name}</p>
        <p className="mt-2 text-sm text-muted">
          Owner{' '}
          {preview.owner_display_name ? (
            <MemberName>{preview.owner_display_name}</MemberName>
          ) : null}{' '}
          · {memberCountLabel(preview.member_count)}
        </p>
        <p className="mt-4 text-sm text-muted">
          Private reviews and watch progress stay inside the group.
        </p>
        {joinError ? (
          <p
            className="mt-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
            role="alert"
          >
            {joinError}
          </p>
        ) : null}
        {status === 'authenticated' ? (
          <Button
            className="mt-6 w-full"
            disabled={redeemInvite.isPending}
            onClick={() => {
              setJoinError(null)
              void redeemInvite.mutateAsync().catch((error: unknown) => {
                setJoinError(toFriendlyRedeemInviteError(error))
              })
            }}
          >
            {redeemInvite.isPending ? 'Joining…' : 'Join group'}
          </Button>
        ) : (
          <Button asChild className="mt-6 w-full">
            <Link to={`/auth?returnTo=${encodeURIComponent(returnTo)}`}>
              Sign in to join
            </Link>
          </Button>
        )}
      </Card>
    </main>
  )
}
