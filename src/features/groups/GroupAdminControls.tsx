import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/ui/select'
import { toFriendlyLeaveGroupError } from '@/features/groups/group-errors'
import type { GroupMember, GroupRow } from '@/features/groups/group-schemas'
import {
  useDeleteGroup,
  useLeaveGroup,
  useRemoveGroupMember,
  useTransferOwnership,
} from '@/features/groups/use-groups'
import { MemberName } from '@/features/groups/MemberName'

export function MemberAdminList({
  groupId,
  members,
}: {
  groupId: string
  members: readonly GroupMember[]
}) {
  const removeMember = useRemoveGroupMember(groupId)
  const [pendingUserId, setPendingUserId] = useState<string | null>(null)
  const pending = members.find((member) => member.user_id === pendingUserId)

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
        Members
      </h2>
      <ul className="space-y-2">
        {members.map((member) => (
          <li
            key={`${member.group_id}:${member.user_id}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface-card px-4 py-3"
          >
            <div>
              <MemberName as="p" className="text-heading">
                {member.display_name}
              </MemberName>
              <p className="text-xs text-muted">
                {member.role === 'owner' ? 'Owner' : 'Member'}
              </p>
            </div>
            {member.role === 'owner' ? null : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setPendingUserId(member.user_id)
                }}
              >
                Remove
              </Button>
            )}
          </li>
        ))}
      </ul>
      <Dialog
        open={Boolean(pending)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingUserId(null)
          }
        }}
      >
        <DialogContent title="Remove member">
          <p className="text-sm text-muted">
            {pending
              ? (
                  <>
                    <MemberName>{pending.display_name}</MemberName>
                    {' will lose access to this group immediately.'}
                  </>
                )
              : null}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setPendingUserId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={removeMember.isPending}
              onClick={() => {
                if (!pendingUserId) {
                  return
                }

                removeMember.mutate(pendingUserId, {
                  onSuccess: () => {
                    setPendingUserId(null)
                  },
                })
              }}
            >
              {removeMember.isPending ? 'Removing…' : 'Remove member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function TransferOwnershipForm({
  groupId,
  members,
  ownerId,
}: {
  groupId: string
  members: readonly GroupMember[]
  ownerId: string
}) {
  const transfer = useTransferOwnership(groupId)
  const candidates = members.filter((member) => member.user_id !== ownerId)
  const [selected, setSelected] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const newOwnerId = selected ?? candidates[0]?.user_id ?? ''

  if (candidates.length === 0) {
    return (
      <section className="space-y-2">
        <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
          Transfer ownership
        </h2>
        <p className="text-sm text-muted">
          Invite another member before you can transfer ownership or leave.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
        Transfer ownership
      </h2>
      <p className="text-sm text-muted">
        The group needs exactly one owner. Transfer before leaving.
      </p>
      <SelectField
        label="New owner"
        aria-label="New owner"
        value={newOwnerId}
        options={candidates.map((member) => ({
          value: member.user_id,
          label: member.display_name,
        }))}
        onValueChange={setSelected}
      />
      <Button
        variant="secondary"
        disabled={!newOwnerId}
        onClick={() => {
          setOpen(true)
        }}
      >
        Transfer ownership
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Transfer ownership">
          <p className="text-sm text-muted">
            You will become a regular member. The new owner can manage invites,
            settings, and the current title.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={transfer.isPending}
              onClick={() => {
                transfer.mutate(newOwnerId, {
                  onSuccess: () => {
                    setOpen(false)
                  },
                })
              }}
            >
              {transfer.isPending ? 'Transferring…' : 'Confirm transfer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function LeaveGroupSection({ groupId }: { groupId: string }) {
  const leave = useLeaveGroup(groupId)
  const [open, setOpen] = useState(false)

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
        Leave group
      </h2>
      <p className="text-sm text-muted">
        You will lose access to this group’s watchlist, reviews, and progress.
      </p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Leave group
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Leave group">
          <p className="text-sm text-muted">
            This cannot be undone unless someone invites you again.
          </p>
          {leave.isError ? (
            <p
              className="mt-3 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
              role="alert"
            >
              {toFriendlyLeaveGroupError(leave.error)}
            </p>
          ) : null}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={leave.isPending}
              onClick={() => {
                leave.mutate()
              }}
            >
              {leave.isPending ? 'Leaving…' : 'Leave group'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}

export function DeleteGroupSection({ group }: { group: GroupRow }) {
  const deleteGroup = useDeleteGroup(group.id)
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const matches = confirmation.trim() === group.name

  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
        Delete group
      </h2>
      <p className="text-sm text-muted">
        This permanently removes the group, invites, progress, and reviews.
      </p>
      <Button variant="danger" onClick={() => setOpen(true)}>
        Delete group
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) {
            setConfirmation('')
          }
        }}
      >
        <DialogContent title="Delete group">
          <p className="text-sm text-muted">
            Type <span className="text-heading">{group.name}</span> to confirm.
          </p>
          <label className="mt-4 block">
            <span className="mb-1 block text-sm text-secondary">
              Group name
            </span>
            <Input
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value)
              }}
              autoComplete="off"
            />
          </label>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setOpen(false)
                setConfirmation('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={!matches || deleteGroup.isPending}
              onClick={() => {
                deleteGroup.mutate()
              }}
            >
              {deleteGroup.isPending ? 'Deleting…' : 'Delete group'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
