import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { useState, type ReactElement } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SelectField } from '@/components/ui/select'
import { CopyInviteLink } from '@/features/invites/CopyInviteLink'
import { toFriendlyCreateInviteError } from '@/features/invites/invite-errors'
import { inviteUrl } from '@/features/invites/invite-link'
import {
  createInviteSchema,
  type CreatedInvite,
  type CreateInviteValues,
} from '@/features/invites/invite-schemas'
import { useCreateInvite } from '@/features/invites/use-invites'
import { getClientEnv } from '@/lib/env'

type CreateInviteDialogProps = {
  groupId: string
  trigger?: ReactElement
}

export function CreateInviteDialog({
  groupId,
  trigger,
}: CreateInviteDialogProps) {
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
        {trigger ?? <Button type="button">Create invite</Button>}
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
        You can copy this link again from the invite list until you revoke it.
      </p>
      {formError ? (
        <p
          className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-heading"
          role="alert"
        >
          {formError}
        </p>
      ) : null}
      <Controller
        name="expiry"
        control={form.control}
        render={({ field }) => (
          <SelectField
            id="invite-expiry"
            label="Expires"
            value={field.value}
            options={[
              { value: '24h', label: 'In 24 hours' },
              { value: '7d', label: 'In 7 days' },
              { value: '30d', label: 'In 30 days' },
              { value: 'never', label: 'No expiry' },
            ]}
            onValueChange={field.onChange}
          />
        )}
      />
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

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">
        Copy this link whenever you need it. It stays available on this page
        until you revoke the invite.
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
      <CopyInviteLink token={created.token} />
    </div>
  )
}
