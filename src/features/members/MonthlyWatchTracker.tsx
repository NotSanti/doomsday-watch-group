import { MemberAvatar } from '@/features/groups/MemberAvatar'
import { MemberName } from '@/features/groups/MemberName'
import type { GroupMember } from '@/features/groups/group-schemas'
import {
  buildYearWatchGrid,
  currentYearInTimeZone,
  // formatYearLabel,
  monthLabelsForYear,
  watchesByCalendarDate,
} from '@/features/members/watch-activity'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import { zonedStartOfDayIso } from '@/lib/timezone'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type MonthlyWatchTrackerProps = {
  member: GroupMember
  progress: readonly GroupProgressRow[]
  timeZone: string
}

const ROW_LABELS: Partial<Record<number, string>> = {
  1: 'Mon',
  3: 'Wed',
  5: 'Fri',
}

function ordinalSuffix(day: number): string {
  const remainder = day % 100
  if (remainder >= 11 && remainder <= 13) {
    return 'TH'
  }

  switch (day % 10) {
    case 1:
      return 'ST'
    case 2:
      return 'ND'
    case 3:
      return 'RD'
    default:
      return 'TH'
  }
}

function formatWatchDay(date: string): string {
  const [, monthText = '', dayText = '1'] = date.split('-')
  const month = Number(monthText)
  const day = Number(dayText)
  const monthLabel =
    new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2026, month - 1, 1)))
      .toUpperCase()

  return `${monthLabel} ${String(day)}${ordinalSuffix(day)}`
}

export function MonthlyWatchTracker({
  member,
  progress,
  timeZone,
}: MonthlyWatchTrackerProps) {
  const watchesByDate = watchesByCalendarDate(progress, member.user_id, timeZone)
  const watchedYears = Array.from(watchesByDate.keys())
    .map((date) => Number(date.split('-')[0]))
    .filter((value) => Number.isFinite(value))

  const year =
    watchedYears.length > 0
      ? Math.max(...watchedYears)
      : currentYearInTimeZone(timeZone)
  const { cells, weekCount } = buildYearWatchGrid(year, watchesByDate, timeZone)
  const monthLabels = monthLabelsForYear(year, timeZone)

  return (
    <article className="elevated-card rounded-xl p-4">
      <div className="flex items-center gap-3">
        <MemberAvatar member={member} highlightOwner />
        <MemberName as="p" className="text-heading">
          {member.display_name}
        </MemberName>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto">
        <div
          aria-hidden="true"
          className="flex shrink-0 flex-col gap-0.75 pt-0.5 text-[10px] text-muted"
        >
          {Array.from({ length: 7 }, (_, row) => (
            <div
              key={row}
              className="flex h-2.75 w-6 items-center leading-none"
            >
              {ROW_LABELS[row] ?? ''}
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <div
            aria-hidden="true"
            className="relative h-4 text-[10px] text-muted"
            style={{ width: `${weekCount * 14 - 3}px` }}
          >
            {monthLabels.map((monthLabel) => (
              <span
                key={monthLabel.label}
                className="absolute top-0"
                style={{ left: `${monthLabel.weekIndex * 14}px` }}
              >
                {monthLabel.label}
              </span>
            ))}
          </div>
          <TooltipProvider>
            <div
              role="grid"
              aria-label={`${member.display_name} watch activity for ${String(year)}`}
              className="flex gap-0.75"
            >
              {Array.from({ length: weekCount }, (_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.75">
                  {Array.from({ length: 7 }, (_, weekday) => {
                    const cell = cells[weekday]?.[weekIndex] ?? null

                    if (!cell) {
                      return (
                        <div
                          key={weekday}
                          aria-hidden="true"
                          className="size-2.75"
                        />
                      )
                    }

                    const formattedDay = formatWatchDay(cell.date)
                    const watchesLabel = cell.watchCount === 1
                      ? `1 WATCH ON ${formattedDay}`
                      : `${String(cell.watchCount)} WATCHES ON ${formattedDay}`

                    const dateIso = zonedStartOfDayIso(cell.date, timeZone)
                    const ariaLabel = cell.active ? watchesLabel : undefined

                    const content = cell.active ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            role="gridcell"
                            tabIndex={0}
                            aria-label={ariaLabel}
                            className={cn(
                              'size-2.75 rounded-xs bg-primary-emphasis',
                              'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-focus',
                            )}
                            data-date={dateIso}
                          />
                        </TooltipTrigger>
                        <TooltipContent className="px-2.5 py-1.5">
                          {watchesLabel}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <div
                        role="gridcell"
                        aria-label={ariaLabel}
                        className={cn(
                          'size-2.75 rounded-xs',
                          'border border-border/50 bg-surface-elevated',
                        )}
                      />
                    )

                    return <div key={weekday}>{content}</div>
                  })}
                </div>
              ))}
            </div>
          </TooltipProvider>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-muted">
        <span>Less</span>
        <span className="size-2.75 rounded-xs border border-border/50 bg-surface-elevated" />
        <span className="size-2.75 rounded-xs bg-primary-emphasis" />
        <span>More</span>
      </div>
    </article>
  )
}
