import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RatingInput } from '@/features/reviews/RatingInput'
import {
  REVIEW_BODY_MAX,
  isReviewFormUnchanged,
  reviewFormSchema,
  type ReviewFormValues,
  type ReviewRow,
} from '@/features/reviews/review-schemas'

type ReviewFormProps = {
  existing: ReviewRow | null
  isSaving: boolean
  onSave: (values: ReviewFormValues) => Promise<unknown> | void
  onCancel: () => void
}

export function ReviewForm({
  existing,
  isSaving,
  onSave,
  onCancel,
}: ReviewFormProps) {
  const [bodyLength, setBodyLength] = useState((existing?.body ?? '').length)
  const [canSave, setCanSave] = useState(existing === null)
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: existing?.rating ?? (undefined as unknown as number),
      body: existing?.body ?? '',
      contains_spoilers: existing?.contains_spoilers ?? false,
    },
  })
  const busy = isSaving || form.formState.isSubmitting

  function syncDirty(next: Partial<ReviewFormValues>) {
    if (!existing) {
      setCanSave(true)
      return
    }

    const current = form.getValues()
    setCanSave(
      !isReviewFormUnchanged(existing, {
        rating: next.rating ?? current.rating,
        body: next.body ?? current.body,
        contains_spoilers: next.contains_spoilers ?? current.contains_spoilers,
      }),
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(async (values) => {
        await onSave(values)
      })}
    >
      <Controller
        name="rating"
        control={form.control}
        render={({ field }) => (
          <RatingInput
            value={typeof field.value === 'number' ? field.value : null}
            disabled={busy}
            onChange={(value) => {
              field.onChange(value)
              syncDirty({ rating: value })
            }}
          />
        )}
      />
      {form.formState.errors.rating ? (
        <p className="text-sm text-danger" role="alert">
          {form.formState.errors.rating.message}
        </p>
      ) : null}

      <div>
        <label className="mb-1 block text-sm text-secondary" htmlFor="review-body">
          Review (optional)
        </label>
        <Textarea
          id="review-body"
          maxLength={REVIEW_BODY_MAX}
          disabled={busy}
          {...form.register('body', {
            onChange: (event) => {
              setBodyLength(event.target.value.length)
              syncDirty({ body: event.target.value })
            },
          })}
        />
        <p className="mt-1 text-xs text-muted">
          {bodyLength} / {REVIEW_BODY_MAX}
        </p>
        {form.formState.errors.body ? (
          <p className="mt-1 text-sm text-danger" role="alert">
            {form.formState.errors.body.message}
          </p>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-heading">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          disabled={busy}
          {...form.register('contains_spoilers', {
            onChange: (event) => {
              syncDirty({ contains_spoilers: event.target.checked })
            },
          })}
        />
        Contains spoilers
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy || !canSave}>
          {isSaving ? 'Saving…' : existing ? 'Update review' : 'Save review'}
        </Button>
        <Button type="button" variant="secondary" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
