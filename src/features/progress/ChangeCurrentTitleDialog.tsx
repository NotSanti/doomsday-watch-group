import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { SelectableTitleRow } from '@/features/progress/SelectableTitleRow'
import type { TitleProgress, TitleRow } from '@/features/watchlist/title-schemas'
import { cn } from '@/lib/utils'

type CurrentTitleFormProps = {
  titles: readonly TitleRow[]
  myProgress?: readonly TitleProgress[]
  skippedTitleIds?: ReadonlySet<string>
  currentTitleId: string | null
  isPending: boolean
  onSave: (titleId: string | null) => Promise<unknown> | void
  /** Taller scroll layout for dialog; settings page uses the default. */
  compactList?: boolean
}

function progressStatusFor(
  progress: readonly TitleProgress[],
  titleId: string,
): TitleProgress['status'] {
  return (
    progress.find((row) => row.title_id === titleId)?.status ?? 'not_started'
  )
}

/** Active catalog in Doomsday order, excluding group-skipped titles. */
function titlesInDoomsdayOrder(
  titles: readonly TitleRow[],
  skippedTitleIds: ReadonlySet<string>,
): TitleRow[] {
  return titles
    .filter(
      (title) =>
        title.is_active &&
        title.doomsday_order != null &&
        !skippedTitleIds.has(title.id),
    )
    .slice()
    .sort((left, right) => {
      const leftOrder = left.doomsday_order ?? Number.MAX_SAFE_INTEGER
      const rightOrder = right.doomsday_order ?? Number.MAX_SAFE_INTEGER
      return leftOrder - rightOrder
    })
}

export function CurrentTitleForm({
  titles,
  myProgress = [],
  skippedTitleIds = new Set(),
  currentTitleId,
  isPending,
  onSave,
  compactList = false,
}: CurrentTitleFormProps) {
  const [selected, setSelected] = useState(currentTitleId ?? '')
  const visible = titlesInDoomsdayOrder(titles, skippedTitleIds)

  function toggleTitle(titleId: string) {
    setSelected((current) => (current === titleId ? '' : titleId))
  }

  return (
    <form
      className="flex min-h-0 flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(selected === '' ? null : selected)
      }}
    >
      <div
        className={cn(
          'min-h-0',
          compactList
            ? 'max-h-[min(28rem,55vh)] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
            : undefined,
        )}
      >
        {visible.length === 0 ? (
          <EmptyState
            title="No titles yet"
            description="The MCU catalog has no active titles to show."
          />
        ) : (
          <ul
            role="listbox"
            aria-label="Current title"
            className="space-y-2"
          >
            {visible.map((title) => (
              <li key={title.id} role="presentation">
                <SelectableTitleRow
                  title={title}
                  status={progressStatusFor(myProgress, title.id)}
                  sort="doomsday"
                  selected={selected === title.id}
                  onSelect={() => {
                    toggleTitle(title.id)
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save current title'}
        </Button>
        {selected !== '' ? (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={() => {
              setSelected('')
            }}
          >
            Clear selection
          </Button>
        ) : null}
      </div>
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
  myProgress,
  skippedTitleIds,
  currentTitleId,
  isPending,
  onSave,
}: ChangeCurrentTitleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Change current title"
        description="Pick a title from the catalog, then save."
        className="flex max-h-[min(40rem,calc(100dvh-2rem))] w-[min(42rem,calc(100%-2rem))] flex-col overflow-hidden"
      >
        <CurrentTitleForm
          key={`${currentTitleId ?? 'none'}:${String(open)}`}
          compactList
          titles={titles}
          myProgress={myProgress}
          skippedTitleIds={skippedTitleIds}
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
