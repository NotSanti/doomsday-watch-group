import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toFriendlyCreateGroupError } from '@/features/groups/group-errors'
import {
  createGroupSchema,
  type CreateGroupValues,
} from '@/features/groups/group-schemas'
import { useCreateGroup } from '@/features/groups/use-groups'

export function CreateGroupForm() {
  const createGroup = useCreateGroup()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<CreateGroupValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: { name: '', description: '' },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        try {
          await createGroup.mutateAsync(values)
        } catch (error) {
          setFormError(toFriendlyCreateGroupError(error))
        }
      })}
    >
      <p className="text-sm text-muted">
        You will be the owner. Invite friends from group settings.
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
          htmlFor="group-name"
        >
          Group name
        </label>
        <Input
          id="group-name"
          autoComplete="off"
          maxLength={60}
          {...form.register('name')}
        />
        {form.formState.errors.name ? (
          <p className="mt-1 text-sm text-danger" role="alert">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="group-description"
        >
          Description (optional)
        </label>
        <Textarea
          id="group-description"
          maxLength={280}
          {...form.register('description')}
        />
        {form.formState.errors.description ? (
          <p className="mt-1 text-sm text-danger" role="alert">
            {form.formState.errors.description.message}
          </p>
        ) : null}
      </div>
      <Button
        className="w-full"
        type="submit"
        disabled={form.formState.isSubmitting || createGroup.isPending}
      >
        {form.formState.isSubmitting || createGroup.isPending
          ? 'Creating…'
          : 'Create group'}
      </Button>
    </form>
  )
}
