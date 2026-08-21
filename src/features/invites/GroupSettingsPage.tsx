import { useState } from 'react'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState } from '@/components/ErrorState'
import { Skeleton } from '@/components/Skeleton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/features/auth/use-auth'
import {
  DeleteGroupSection,
  LeaveGroupSection,
  MemberAdminList,
  TransferOwnershipForm,
} from '@/features/groups/GroupAdminControls'
import { GroupSettingsForm } from '@/features/groups/GroupSettingsForm'
import { toFriendlyGroupDetailError, toFriendlyGroupMembersError } from '@/features/groups/group-errors'
import { groupRoleForUser } from '@/features/groups/group-schemas'
import { useGroup, useGroupMembers, useSetCurrentTitle } from '@/features/groups/use-groups'
import { ChangeCurrentTitleDialog } from '@/features/progress/ChangeCurrentTitleDialog'
import { useGroupProgress } from '@/features/progress/use-progress'
import { InviteManager } from '@/features/invites/InviteManager'
import { toFriendlyTitleListError } from '@/features/watchlist/title-errors'
import { useGroupSkippedTitles } from '@/features/watchlist/use-skipped-titles'
import { useTitleList } from '@/features/watchlist/use-titles'
import { useParams } from 'react-router'

export function GroupSettingsPage() {
  const { groupId = '' } = useParams()
  const { user } = useAuth()
  const groupQuery = useGroup(groupId)
  const membersQuery = useGroupMembers(groupId)
  const titlesQuery = useTitleList()
  const progressQuery = useGroupProgress(groupId)
  const skippedQuery = useGroupSkippedTitles(groupId)
  const setCurrentTitle = useSetCurrentTitle(groupId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const group = groupQuery.data
  const isOwner = Boolean(
    group && user && groupRoleForUser(group, user.id) === 'owner',
  )
  const titles = titlesQuery.data ?? []
  const currentTitle = titles.find((title) => title.id === group?.current_title_id)
  const myProgress = (progressQuery.data ?? [])
    .filter((row) => row.user_id === user?.id)
    .map((row) => ({ title_id: row.title_id, status: row.status }))
  const skippedTitleIds = new Set(
    (skippedQuery.data ?? []).map((row) => row.title_id),
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

  const members = membersQuery.data ?? []

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl tracking-[0.08em] text-heading uppercase">
          Group settings
        </h1>
        <p className="mt-2 text-muted">
          {isOwner
            ? 'Rename the group, manage invites, and handle membership.'
            : 'Members can leave from here. Only the owner can change group details.'}
        </p>
      </header>
      {isOwner ? (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
              Group details
            </h2>
            <GroupSettingsForm key={`${group.name}:${group.updated_at}`} group={group} />
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-2xl tracking-[0.08em] text-heading uppercase">
              Current title
            </h2>
            {titlesQuery.isPending || skippedQuery.isPending ? (
              <Skeleton className="h-16 w-full" />
            ) : titlesQuery.isError || skippedQuery.isError ? (
              <ErrorState
                message={toFriendlyTitleListError()}
                onRetry={() => {
                  void titlesQuery.refetch()
                  void skippedQuery.refetch()
                }}
              />
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-secondary">
                  {currentTitle ? (
                    <>
                      Now watching:{' '}
                      <span className="text-heading">{currentTitle.name}</span>
                    </>
                  ) : (
                    'No current title selected.'
                  )}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant={currentTitle ? 'secondary' : 'primary'}
                  onClick={() => {
                    setPickerOpen(true)
                  }}
                >
                  {currentTitle ? 'Change current title' : 'Choose current title'}
                </Button>
              </div>
            )}
          </section>
          <InviteManager groupId={group.id} />
          {membersQuery.isError ? (
            <ErrorState
              message={toFriendlyGroupMembersError()}
              onRetry={() => {
                void membersQuery.refetch()
              }}
            />
          ) : (
            <MemberAdminList groupId={group.id} members={members} />
          )}
          <TransferOwnershipForm
            groupId={group.id}
            members={members}
            ownerId={group.owner_id}
          />
          <DeleteGroupSection group={group} />
          <ChangeCurrentTitleDialog
            open={pickerOpen}
            onOpenChange={setPickerOpen}
            titles={titles}
            myProgress={myProgress}
            skippedTitleIds={skippedTitleIds}
            currentTitleId={group.current_title_id}
            isPending={setCurrentTitle.isPending}
            onSave={(titleId) => setCurrentTitle.mutateAsync(titleId)}
          />
        </>
      ) : (
        <>
          <EmptyState
            title="Owner-only controls"
            description="Only the group owner can rename the group, change the current title, or manage invites."
          />
          <LeaveGroupSection groupId={group.id} />
        </>
      )}
    </div>
  )
}
