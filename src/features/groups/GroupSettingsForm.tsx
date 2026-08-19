import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toFriendlyGroupSettingsError } from '@/features/groups/group-errors'
import {
  updateGroupSettingsSchema,
  type GroupRow,
  type UpdateGroupSettingsValues,
} from '@/features/groups/group-schemas'
import { useUpdateGroupSettings } from '@/features/groups/use-groups'

type GroupSettingsFormProps = {
  group: GroupRow
}

export function GroupSettingsForm({ group }: GroupSettingsFormProps) {
  const updateSettings = useUpdateGroupSettings(group.id)
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<UpdateGroupSettingsValues>({
    resolver: zodResolver(updateGroupSettingsSchema),
    defaultValues: {
      name: group.name,
      description: group.description ?? '',
    },
  })

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        setFormError(null)
        try {
          await updateSettings.mutateAsync(values)
        } catch (error) {
          setFormError(toFriendlyGroupSettingsError(error))
        }
      })}
    >
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
          htmlFor="settings-name"
        >
          Group name
        </label>
        <Input id="settings-name" maxLength={60} {...form.register('name')} />
        {form.formState.errors.name ? (
          <p className="mt-1 text-sm text-danger" role="alert">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>
      <div>
        <label
          className="mb-1 block text-sm text-secondary"
          htmlFor="settings-description"
        >
          Description (optional)
        </label>
        <Textarea
          id="settings-description"
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
        type="submit"
        disabled={form.formState.isSubmitting || updateSettings.isPending}
      >
        {form.formState.isSubmitting || updateSettings.isPending
          ? 'Saving…'
          : 'Save details'}
      </Button>
    </form>
  )
}
