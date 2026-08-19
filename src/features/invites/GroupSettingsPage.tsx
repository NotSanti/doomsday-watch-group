import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { useAuth } from '@/features/auth/use-auth'
import { toFriendlyGroupDetailError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { useGroup, useSetCurrentTitle } from '@/features/groups/use-groups'
import { CurrentTitleForm } from '@/features/progress/ChangeCurrentTitleDialog'
import { InviteManager } from '@/features/invites/InviteManager'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import { useTitleList } from '@/features/watchlist/use-titles'
import { useParams } from 'react-router'

export function GroupSettingsPage() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const titlesQuery = useTitleList()
  const setCurrentTitle = useSetCurrentTitle(groupId)
  const group = groupQuery.data
  const isOwner = Boolean(
    group && user && groupRoleForUser(group, user.id) === 'owner',
  )

  if (groupQuery.isPending) {
    return (
      <div role="status" aria-live="polite">
        <span className="sr-only">Loading settings</span>
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  if (groupQuery.isError || !group) {
    return (
      <ErrorState
        message={toFriendlyGroupDetailError()}
        onRetry={() => {
          void groupQuery.refetch()
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Group settings
        </h1>
        <p className="mt-2 text-muted">
          Current title and invite links are owner-only. Other group controls
          land in a later milestone.
        </p>
      </header>
      {isOwner ? (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
              Current title
            </h2>
            {titlesQuery.isPending ? (
              <Skeleton className="h-24 w-full" />
            ) : titlesQuery.isError ? (
              <ErrorState
                message={toFriendlyTitleListError()}
                onRetry={() => {
                  void titlesQuery.refetch()
                }}
              />
            ) : (
              <CurrentTitleForm
                key={group.current_title_id ?? 'none'}
                titles={titlesQuery.data ?? []}
                currentTitleId={group.current_title_id}
                isPending={setCurrentTitle.isPending}
                onSave={(titleId) => setCurrentTitle.mutateAsync(titleId)}
              />
            )}
          </section>
          <InviteManager groupId={group.id} />
        </>
      ) : (
        <EmptyState
          title="Owner only"
          description="Only the group owner can change the current title and manage invites."
        />
      )}
    </div>
  )
}
