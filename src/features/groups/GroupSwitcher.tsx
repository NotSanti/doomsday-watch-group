import { useLocation, useNavigate, useParams } from 'react-router'
import { useGroupList } from '@/features/groups/use-groups'
import { cn } from '@/lib/utils'

export function GroupSwitcher() {
  const groupsQuery = useGroupList()
  const { groupId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const groups = groupsQuery.data ?? []

  if (groups.length === 0) {
    return null
  }

  return (
    <div className="min-w-44">
      <label className="sr-only" htmlFor="group-switcher">
        Switch group
      </label>
      <select
        id="group-switcher"
        aria-label="Switch group"
        className={cn(
          'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-heading',
          'hover:border-border-strong focus-visible:outline-none',
        )}
        value={groups.some((group) => group.id === groupId) ? groupId : ''}
        onChange={(event) => {
          const nextId = event.target.value

          if (!nextId) {
            void navigate('/app')
            return
          }

          if (groupId && location.pathname.startsWith(`/groups/${groupId}`)) {
            const rest = location.pathname.slice(`/groups/${groupId}`.length)
            void navigate(`/groups/${nextId}${rest}`)
            return
          }

          void navigate(`/groups/${nextId}`)
        }}
      >
        <option value="">Your groups</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  )
}
