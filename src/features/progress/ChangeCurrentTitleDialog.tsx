import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { TitleRow } from '@/features/watchlist/title-schemas'

type CurrentTitleFormProps = {
  titles: readonly TitleRow[]
  currentTitleId: string | null
  isPending: boolean
  onSave: (titleId: string | null) => Promise<unknown> | void
}

function orderedTitles(titles: readonly TitleRow[]): TitleRow[] {
  return titles
    .filter((title) => title.is_active)
    .slice()
    .sort((left, right) => {
      const leftOrder = left.doomsday_order ?? left.release_order
      const rightOrder = right.doomsday_order ?? right.release_order
      return leftOrder - rightOrder
    })
}

export function CurrentTitleForm({
  titles,
  currentTitleId,
  isPending,
  onSave,
}: CurrentTitleFormProps) {
  const [selected, setSelected] = useState(currentTitleId ?? '')

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(selected === '' ? null : selected)
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm text-secondary">Current title</span>
        <select
          aria-label="Current title"
          className="h-11 w-full rounded-md border border-border bg-surface-card px-3 text-sm text-heading"
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value)
          }}
        >
          <option value="">None</option>
          {orderedTitles(titles).map((title) => (
            <option key={title.id} value={title.id}>
              {title.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Saving…' : 'Save current title'}
      </Button>
    </form>
  )
}

type ChangeCurrentTitleDialogProps = CurrentTitleFormProps & {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChangeCurrentTitleDialog({
  open,
  onOpenChange,
  titles,
  currentTitleId,
  isPending,
  onSave,
}: ChangeCurrentTitleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Change current title">
        <CurrentTitleForm
          key={`${currentTitleId ?? 'none'}:${String(open)}`}
          titles={titles}
          currentTitleId={currentTitleId}
          isPending={isPending}
          onSave={async (titleId) => {
            await onSave(titleId)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}
