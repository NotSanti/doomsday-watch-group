import { Badge } from '@/components/ui/badge'
import type { GroupMember } from '@/features/groups/group-schemas'
import { progressStatusFor } from '@/features/progress/progress-metrics'
import type { GroupProgressRow } from '@/features/progress/progress-schemas'
import {
  TITLE_STATUS_LABEL,
  isTitleWatched,
  type TitleRow,
} from '@/features/watchlist/title-schemas'

type MemberComparisonGridProps = {
  members: readonly GroupMember[]
  titles: readonly TitleRow[]
  progress: readonly GroupProgressRow[]
}

export function MemberComparisonGrid({
  members,
  titles,
  progress,
}: MemberComparisonGridProps) {
  if (titles.length === 0 || members.length === 0) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-left text-sm">
        <caption className="sr-only">
          Member status on the current title and the next few Doomsday-order titles
        </caption>
        <thead className="bg-surface">
          <tr>
            <th scope="col" className="px-3 py-2 font-medium text-secondary">
              Member
            </th>
            {titles.map((title) => (
              <th
                key={title.id}
                scope="col"
                className="px-3 py-2 font-medium text-secondary"
              >
                {title.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={`${member.group_id}:${member.user_id}`} className="border-t border-border">
              <th scope="row" className="px-3 py-2 font-medium text-heading">
                {member.display_name}
              </th>
              {titles.map((title) => {
                const status = progressStatusFor(
                  progress,
                  member.user_id,
                  title.id,
                )

                return (
                  <td key={title.id} className="px-3 py-2">
                    <Badge
                      tone={isTitleWatched(status) ? 'watched' : 'notStarted'}
                    >
                      {TITLE_STATUS_LABEL[status]}
                    </Badge>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
