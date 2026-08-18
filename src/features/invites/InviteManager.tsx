import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { CopyInviteLink } from '@/features/invites/CopyInviteLink'
import { CreateInviteDialog } from '@/features/invites/CreateInviteDialog'
import {
  toFriendlyInviteListError,
  toFriendlyRevokeInviteError,
} from '@/features/invites/invite-errors'
import { inviteStatus, type InviteRow } from '@/features/invites/invite-schemas'
import { useInviteList, useRevokeInvite } from '@/features/invites/use-invites'

const STATUS_LABEL: Record<ReturnType<typeof inviteStatus>, string> = {
  active: 'Active',
  revoked: 'Revoked',
  expired: 'Expired',
  exhausted: 'Exhausted',
}

function formatStamp(iso: string | null): string {
  if (!iso) {
    return 'No expiry'
  }

  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso))
}

function usesLabel(invite: InviteRow): string {
  if (invite.max_uses === null) {
    return `${invite.use_count} used · Unlimited`
  }

  return `${invite.use_count} / ${invite.max_uses} uses`
}

export function InviteManager({ groupId }: { groupId: string }) {
  const invitesQuery = useInviteList(groupId, true)

  if (invitesQuery.isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading invites</span>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    )
  }

  if (invitesQuery.isError) {
    return (
      <ErrorState
        message={toFriendlyInviteListError()}
        onRetry={() => {
          void invitesQuery.refetch()
        }}
      />
    )
  }

  const invites = invitesQuery.data ?? []

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
            Invites
          </h2>
          <p className="mt-1 text-sm text-muted">
            Copy a link as often as you need, then revoke it if it should stop
            working.
          </p>
        </div>
        <CreateInviteDialog groupId={groupId} />
      </div>
      {invites.length === 0 ? (
        <EmptyState
          title="No invites yet"
          description="Create a link to invite people into this private group."
        />
      ) : (
        <ul className="space-y-3">
          {invites.map((invite) => (
            <li key={invite.id}>
              <InviteRowCard groupId={groupId} invite={invite} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function InviteRowCard({
  groupId,
  invite,
}: {
  groupId: string
  invite: InviteRow
}) {
  const status = inviteStatus(invite)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const revokeInvite = useRevokeInvite(groupId)

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-heading">
              Created {formatStamp(invite.created_at)}
            </p>
            <Badge tone={status === 'active' ? 'watching' : 'muted'}>
              {STATUS_LABEL[status]}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-muted">
            Expires {formatStamp(invite.expires_at)} · {usesLabel(invite)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invite.token && !invite.revoked_at ? (
            <CopyInviteLink token={invite.token} size="sm" />
          ) : null}
          {status === 'active' ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Revoke
            </Button>
          ) : null}
        </div>
      </div>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent title="Revoke invite">
          <p className="text-sm text-muted">
            This link will stop working. People who already joined stay in the
            group.
          </p>
          {revokeError ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {revokeError}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={revokeInvite.isPending}
              onClick={() => {
                setRevokeError(null)
                void revokeInvite.mutateAsync(invite.id).then(
                  () => {
                    setConfirmOpen(false)
                  },
                  (error: unknown) => {
                    setRevokeError(toFriendlyRevokeInviteError(error))
                  },
                )
              }}
            >
              {revokeInvite.isPending ? 'Revoking…' : 'Revoke invite'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
