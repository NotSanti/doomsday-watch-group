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
  /** Taller scroll layout for dialog use. */
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

/** Active catalog in release order, excluding group-skipped titles. */
function titlesInReleaseOrder(
  titles: readonly TitleRow[],
  skippedTitleIds: ReadonlySet<string>,
): TitleRow[] {
  return titles
    .filter((title) => title.is_active && !skippedTitleIds.has(title.id))
    .slice()
    .sort((left, right) => left.release_order - right.release_order)
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
  const visible = titlesInReleaseOrder(titles, skippedTitleIds)

  function toggleTitle(titleId: string) {
    setSelected((current) => (current === titleId ? '' : titleId))
  }

  return (
    <form
      className={cn(
        'flex min-h-0 flex-col gap-4',
        compactList && 'flex-1',
      )}
      onSubmit={(event) => {
        event.preventDefault()
        void onSave(selected === '' ? null : selected)
      }}
    >
      <div
        className={cn(
          'min-h-0',
          compactList
            ? 'flex-1 overflow-y-auto [scrollbar-width:none] md:max-h-[min(28rem,55vh)] md:flex-none [&::-webkit-scrollbar]:hidden'
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
                  sort="release"
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
      <div className="flex shrink-0 flex-wrap items-center gap-3">
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
        className="md:flex md:max-h-[min(40rem,calc(100dvh-2rem))] md:w-[min(42rem,calc(100%-2rem))] md:flex-col md:overflow-hidden"
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
