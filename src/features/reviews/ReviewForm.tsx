import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { RatingInput } from '@/features/reviews/RatingInput'
import {
  REVIEW_BODY_MAX,
  reviewFormSchema,
  type ReviewFormValues,
  type ReviewRow,
} from '@/features/reviews/review-schemas'

type ReviewFormProps = {
  existing: ReviewRow | null
  isSaving: boolean
  isDeleting: boolean
  onSave: (values: ReviewFormValues) => Promise<unknown> | void
  onDelete?: () => Promise<unknown> | void
}

export function ReviewForm({
  existing,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: ReviewFormProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bodyLength, setBodyLength] = useState((existing?.body ?? '').length)
  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    values: {
      rating: existing?.rating ?? (undefined as unknown as number),
      body: existing?.body ?? '',
      contains_spoilers: existing?.contains_spoilers ?? false,
    },
  })
  const busy = isSaving || isDeleting || form.formState.isSubmitting

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
            onChange={field.onChange}
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
          {...form.register('contains_spoilers')}
        />
        Contains spoilers
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={busy}>
          {isSaving ? 'Saving…' : existing ? 'Update review' : 'Save review'}
        </Button>
        {existing && onDelete ? (
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={() => {
              setConfirmOpen(true)
            }}
          >
            Delete review
          </Button>
        ) : null}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent title="Delete review">
          <p className="text-sm text-muted">
            This removes your rating and review for this title.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="danger"
              disabled={busy}
              onClick={async () => {
                await onDelete?.()
                setConfirmOpen(false)
              }}
            >
              {isDeleting ? 'Deleting…' : 'Delete review'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirmOpen(false)
              }}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
