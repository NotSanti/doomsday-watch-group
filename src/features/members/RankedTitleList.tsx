import { TitleRankingRow } from '@/features/members/TitleRankingRow'
import type { RankedTitleRating } from '@/features/members/title-ranking'
import { cn } from '@/lib/utils'

type RankedTitleListProps = {
  items: readonly RankedTitleRating[]
  groupId: string
  label: string
  className?: string
}

export function RankedTitleList({
  items,
  groupId,
  label,
  className,
}: RankedTitleListProps) {
  return (
    <ol
      aria-label={label}
      className={cn('min-w-0 list-none space-y-2', className)}
    >
      {items.map((item, index) => (
        <li key={item.title.id} className="min-w-0">
          <TitleRankingRow
            rank={index + 1}
            title={item.title}
            rating={item.rating}
            href={`/groups/${groupId}/titles/${item.title.id}`}
          />
        </li>
      ))}
    </ol>
  )
}
