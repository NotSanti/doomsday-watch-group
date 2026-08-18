import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toFriendlyCreateInviteError } from '@/features/invites/invite-errors'
import { inviteUrl } from '@/features/invites/invite-link'
import {
  createInviteSchema,
  type CreatedInvite,
  type CreateInviteValues,
} from '@/features/invites/invite-schemas'
import { useCreateInvite } from '@/features/invites/use-invites'
import { getClientEnv } from '@/lib/env'
import { cn } from '@/lib/utils'

const selectClassName = cn(
  'h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-heading',
  'hover:border-border-strong focus-visible:outline-none',
)

export function CreateInviteDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<CreatedInvite | null>(null)

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) {
          setCreated(null)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>Create invite</Button>
      </DialogTrigger>
      <DialogContent title={created ? 'Invite link' : 'Create invite'}>
        {created ? (
          <CreatedInviteCopy created={created} />
        ) : (
          <CreateInviteForm
            groupId={groupId}
            onCreated={(invite) => {
              setCreated(invite)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function CreateInviteForm({
  groupId,
  onCreated,
}: {
  groupId: string
  onCreated: (invite: CreatedInvite) => void
}) {
  const createInvite = useCreateInvite(groupId)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<CreateInviteValues>({
    resolver: zodResolver(createInviteSchema),
    defaultValues: { expiry: '7d', maxUses: '' },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        try {
          const invite = await createInvite.mutateAsync(values)
          onCreated(invite)
        } catch (error) {
          setFormError(toFriendlyCreateInviteError(error))
        }
      })}
    >
      <p className="text-sm text-muted">
        The full link is shown once. Store only what you copy here.
      </p>
      {formError ? (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="invite-expiry"
        >
          Expires
        </label>
        <select
          id="invite-expiry"
          className={selectClassName}
          {...form.register('expiry')}
        >
          <option value="24h">In 24 hours</option>
          <option value="7d">In 7 days</option>
          <option value="30d">In 30 days</option>
          <option value="never">No expiry</option>
        </select>
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="invite-max-uses"
        >
          Max uses (optional)
        </label>
        <Input
          id="invite-max-uses"
          inputMode="numeric"
          placeholder="Unlimited"
          {...form.register('maxUses')}
        />
        {form.formState.errors.maxUses ? (
          <p className="mt-1 text-sm text-danger" role="alert">
            {form.formState.errors.maxUses.message}
          </p>
        ) : null}
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting || createInvite.isPending}
      >
        {form.formState.isSubmitting || createInvite.isPending
          ? 'Creating…'
          : 'Create invite'}
      </Button>
    </form>
  )
}

function CreatedInviteCopy({ created }: { created: CreatedInvite }) {
  const url = inviteUrl(getClientEnv().VITE_APP_URL, created.token)
  const [copied, setCopied] = useState(false)

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Copy this link now. It cannot be recovered after you close this dialog.
      </p>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="invite-link"
        >
          Invite link
        </label>
        <Input id="invite-link" readOnly value={url} />
      </div>
      <Button
        className="w-full"
        onClick={() => {
          void navigator.clipboard.writeText(url).then(
            () => {
              setCopied(true)
              toast.success('Invite link copied')
            },
            () => {
              toast.success('Select the link to copy it')
            },
          )
        }}
      >
        {copied ? 'Copied' : 'Copy link'}
      </Button>
    </div>
  )
}
