import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { ProfileRow } from '@/features/auth/auth-schemas'
import type { GroupMember, GroupRow } from '@/features/groups/group-schemas'
import {
  inviteStatus,
  type InvitePreview,
  type InviteRow,
} from '@/features/invites/invite-schemas'
import type { ReviewRow } from '@/features/reviews/review-schemas'
import type { TitleRow, TitleStatus } from '@/features/watchlist/title-schemas'

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void

export type MockInvite = InviteRow & {
  secret: string
  group_name?: string
  owner_display_name?: string
  member_count?: number
}

export type MockMember = GroupMember

export type MockTitleProgress = {
  group_id: string
  user_id: string
  title_id: string
  status: TitleStatus
  started_at: string | null
  watched_at: string | null
}

let session: Session | null = null
let profile: ProfileRow | null = null
let profileError: { message: string } | null = null
let groups: GroupRow[] = []
let groupsError: { message: string } | null = null
let createGroupError: { code?: string; message: string } | null = null
let members: MockMember[] = []
let membersError: { message: string } | null = null
let invites: MockInvite[] = []
let invitesError: { message: string } | null = null
let createInviteError: { code?: string; message: string } | null = null
let previewError: { code?: string; message: string } | null = null
let redeemError: { code?: string; message: string } | null = null
let revokeError: { code?: string; message: string } | null = null
let deleteInviteError: { code?: string; message: string } | null = null
let titles: TitleRow[] = []
let titlesError: { message: string } | null = null
let progress: MockTitleProgress[] = []
let progressError: { message: string } | null = null
let progressWriteError: { code?: string; message: string } | null = null
let reviews: ReviewRow[] = []
let reviewsError: { message: string } | null = null
let reviewWriteError: { code?: string; message: string } | null = null
let groupWriteError: { code?: string; message: string } | null = null
let leaveGroupError: { code?: string; message: string } | null = null
let transferOwnershipError: { code?: string; message: string } | null = null
let notificationPreferences: Record<string, {
  user_id: string
  member_joined: boolean
  member_watched: boolean
  member_rated: boolean
  member_reviewed: boolean
  group_ready_for_next_title: boolean
  daily_countdown: boolean
  last_daily_countdown_sent_on: string | null
  updated_at: string
}> = {}
let pushSubscriptionCount = 0
const listeners = new Set<AuthListener>()
const realtimeHandlers: {
  table: string
  channelName: string
  callback: () => void
}[] = []
const activeRealtimeChannelNames = new Set<string>()

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'owner@example.test',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { display_name: 'Owner A' },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    ...overrides,
  } as User
}

export function makeSession(overrides: { user?: Partial<User> } = {}): Session {
  const user = makeUser(overrides.user)

  return {
    access_token: 'access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'refresh-token',
    user,
  }
}

export function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    display_name: 'Owner A',
    avatar_url: 'icon:iron-man',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function makeGroup(overrides: Partial<GroupRow> = {}): GroupRow {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Alpha Watch',
    description: 'Group A',
    owner_id: '11111111-1111-4111-8111-111111111111',
    current_title_id: null,
    target_date: '2026-12-18T05:00:00.000Z',
    timezone: 'America/Toronto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function makeMember(overrides: Partial<MockMember> = {}): MockMember {
  return {
    group_id: '22222222-2222-4222-8222-222222222222',
    user_id: '11111111-1111-4111-8111-111111111111',
    role: 'owner',
    joined_at: new Date().toISOString(),
    display_name: 'Owner A',
    avatar_url: 'icon:iron-man',
    ...overrides,
  }
}

export function makeInvite(overrides: Partial<MockInvite> = {}): MockInvite {
  const token =
    overrides.token === undefined ? 'ab'.repeat(32) : overrides.token
  const invite: MockInvite = {
    id: '66666666-6666-4666-8666-666666666666',
    group_id: '22222222-2222-4222-8222-222222222222',
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    max_uses: null,
    use_count: 0,
    revoked_at: null,
    token,
    secret: token ?? 'ab'.repeat(32),
    ...overrides,
  }

  invite.secret = overrides.secret ?? invite.token ?? invite.secret
  return invite
}

export function makeTitle(overrides: Partial<TitleRow> = {}): TitleRow {
  return {
    id: 'aa000000-0000-4000-8000-000000000001',
    tmdb_id: 1726,
    media_type: 'movie',
    name: 'Iron Man',
    release_date: '2008-05-02',
    runtime_minutes: 126,
    episode_count: null,
    poster_path: '/78lPtwv72eTNqFW9COYM7C5Tl7.jpg',
    backdrop_path: '/cyecB5K0or8jv4n3oRMePqHLkhC.jpg',
    synopsis: 'An industrialist builds a powered suit of armor.',
    phase: 1,
    saga: 'Infinity Saga',
    era: 'Phase 1 — The Avengers Initiative (2008–2012)',
    importance: 'essential',
    release_order: 1,
    doomsday_order: 3,
    is_active: true,
    ...overrides,
  }
}

export function makeTitleProgress(
  overrides: Partial<MockTitleProgress> = {},
): MockTitleProgress {
  return {
    group_id: '22222222-2222-4222-8222-222222222222',
    user_id: '11111111-1111-4111-8111-111111111111',
    title_id: 'aa000000-0000-4000-8000-000000000001',
    status: 'not_started',
    started_at: null,
    watched_at: null,
    ...overrides,
  }
}

export function setMockSession(next: Session | null): void {
  session = next
}

export function setMockProfile(
  next: ProfileRow | null,
  error: { message: string } | null = null,
): void {
  profile = next
  profileError = error
}

export function setMockGroups(
  next: GroupRow[],
  error: { message: string } | null = null,
): void {
  groups = next
  groupsError = error
  members = next.map((group) =>
    makeMember({
      group_id: group.id,
      user_id: group.owner_id,
      role: 'owner',
      joined_at: group.created_at,
      display_name:
        profile?.id === group.owner_id
          ? profile.display_name
          : 'Group owner',
    }),
  )
}

export function setMockMembers(
  next: MockMember[],
  error: { message: string } | null = null,
): void {
  members = next
  membersError = error
}

export function setCreateGroupError(
  error: { code?: string; message: string } | null,
): void {
  createGroupError = error
}

export function setMockInvites(
  next: MockInvite[],
  error: { message: string } | null = null,
): void {
  invites = next
  invitesError = error
}

export function setCreateInviteError(
  error: { code?: string; message: string } | null,
): void {
  createInviteError = error
}

export function setPreviewInviteError(
  error: { code?: string; message: string } | null,
): void {
  previewError = error
}

export function setRedeemInviteError(
  error: { code?: string; message: string } | null,
): void {
  redeemError = error
}

export function setRevokeInviteError(
  error: { code?: string; message: string } | null,
): void {
  revokeError = error
}

export function setDeleteInviteError(
  error: { code?: string; message: string } | null,
): void {
  deleteInviteError = error
}

export function setMockTitles(
  next: TitleRow[],
  error: { message: string } | null = null,
): void {
  titles = next
  titlesError = error
}

export function setMockProgress(
  next: MockTitleProgress[],
  error: { message: string } | null = null,
): void {
  progress = next
  progressError = error
}

export function setProgressWriteError(
  error: { code?: string; message: string } | null,
): void {
  progressWriteError = error
}

export function getMockProgress(): MockTitleProgress[] {
  return progress
}

export function makeReview(overrides: Partial<ReviewRow> = {}): ReviewRow {
  return {
    id: '77777777-7777-4777-8777-777777777777',
    group_id: '22222222-2222-4222-8222-222222222222',
    user_id: '11111111-1111-4111-8111-111111111111',
    title_id: 'aa000000-0000-4000-8000-000000000001',
    rating: 8.5,
    body: 'A strong start.',
    contains_spoilers: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

export function setMockReviews(
  next: ReviewRow[],
  error: { message: string } | null = null,
): void {
  reviews = next
  reviewsError = error
}

export function setReviewWriteError(
  error: { code?: string; message: string } | null,
): void {
  reviewWriteError = error
}

export function getMockReviews(): ReviewRow[] {
  return reviews
}

export function setGroupWriteError(
  error: { code?: string; message: string } | null,
): void {
  groupWriteError = error
}

export function setLeaveGroupError(
  error: { code?: string; message: string } | null,
): void {
  leaveGroupError = error
}

export function setTransferOwnershipError(
  error: { code?: string; message: string } | null,
): void {
  transferOwnershipError = error
}

export function getMockInvites(): MockInvite[] {
  return invites
}

export function emitAuthEvent(
  event: AuthChangeEvent,
  next: Session | null,
): void {
  session = next
  for (const listener of listeners) {
    listener(event, next)
  }
}

type AuthResponse = {
  data: { session: Session | null; user: User | null }
  error: { code?: string; message?: string } | null
}

type RpcError = { code?: string; message: string }

function isOwnerOf(groupId: string): boolean {
  const group = groups.find((item) => item.id === groupId)
  return Boolean(session && group && group.owner_id === session.user.id)
}

function memberToRow(member: MockMember) {
  return {
    group_id: member.group_id,
    user_id: member.user_id,
    role: member.role,
    joined_at: member.joined_at,
    profiles: {
      display_name: member.display_name,
      avatar_url: member.avatar_url,
    },
  }
}

function inviteToRow(invite: MockInvite): InviteRow {
  return {
    id: invite.id,
    group_id: invite.group_id,
    created_at: invite.created_at,
    expires_at: invite.expires_at,
    max_uses: invite.max_uses,
    use_count: invite.use_count,
    revoked_at: invite.revoked_at,
    token: invite.token,
  }
}

function previewFromInvite(invite: MockInvite | undefined): InvitePreview {
  if (!invite) {
    return {
      group_name: null,
      owner_display_name: null,
      member_count: null,
      is_valid: false,
      invalid_reason: 'invalid',
    }
  }

  const status = inviteStatus(invite)
  const isValid = status === 'active'

  return {
    group_name: invite.group_name ?? 'Alpha Watch',
    owner_display_name: invite.owner_display_name ?? 'Owner A',
    member_count: invite.member_count ?? 1,
    is_valid: isValid,
    invalid_reason: isValid ? null : status,
  }
}

async function createGroupImpl(args: {
  p_name: string
  p_description?: string
}) {
  if (createGroupError) {
    return { data: null, error: createGroupError }
  }

  const group = makeGroup({
    id: crypto.randomUUID(),
    name: args.p_name,
    description: args.p_description ?? null,
    owner_id: session?.user.id ?? '11111111-1111-4111-8111-111111111111',
  })
  groups = [...groups, group]
  members = [
    ...members,
    makeMember({
      group_id: group.id,
      user_id: group.owner_id,
      role: 'owner',
      joined_at: group.created_at,
      display_name: profile?.display_name ?? 'Owner A',
    }),
  ]
  return { data: group, error: null }
}

async function createInviteImpl(args: {
  p_group_id: string
  p_expires_at?: string
  p_max_uses?: number
}) {
  if (createInviteError) {
    return { data: null, error: createInviteError }
  }

  if (!session || !isOwnerOf(args.p_group_id)) {
    return {
      data: null,
      error: { code: '42501', message: 'Only owners can create invites' },
    }
  }

  const token =
    crypto.randomUUID().replaceAll('-', '') +
    crypto.randomUUID().replaceAll('-', '')
  const invite = makeInvite({
    id: crypto.randomUUID(),
    group_id: args.p_group_id,
    token,
    secret: token,
    expires_at: args.p_expires_at ?? null,
    max_uses: args.p_max_uses ?? null,
  })
  invites = [invite, ...invites]
  return {
    data: [
      {
        invite_id: invite.id,
        token: invite.token ?? invite.secret,
        expires_at: invite.expires_at,
        max_uses: invite.max_uses,
      },
    ],
    error: null,
  }
}

async function previewInviteImpl(args: { p_token: string }) {
  if (previewError) {
    return { data: null, error: previewError }
  }

  return {
    data: [
      previewFromInvite(
        invites.find((invite) => invite.secret === args.p_token),
      ),
    ],
    error: null,
  }
}

async function redeemInviteImpl(args: { p_token: string }) {
  if (redeemError) {
    return { data: null, error: redeemError }
  }

  if (!session) {
    return {
      data: null,
      error: { code: '42501', message: 'Not authenticated' } satisfies RpcError,
    }
  }

  const invite = invites.find((item) => item.secret === args.p_token)
  if (!invite) {
    return {
      data: null,
      error: { code: '22023', message: 'Invite is not valid' },
    }
  }

  const status = inviteStatus(invite)
  if (status === 'revoked') {
    return {
      data: null,
      error: { code: '22023', message: 'Invite is revoked' },
    }
  }
  if (status === 'expired') {
    return {
      data: null,
      error: { code: '22023', message: 'Invite is expired' },
    }
  }

  const alreadyMember = groups.some((group) => group.id === invite.group_id)
  if (alreadyMember) {
    return {
      data: [{ group_id: invite.group_id, already_member: true }],
      error: null,
    }
  }

  if (status === 'exhausted') {
    return {
      data: null,
      error: { code: '22023', message: 'Invite has no remaining uses' },
    }
  }

  invite.use_count += 1
  const group = makeGroup({
    id: invite.group_id,
    owner_id: '11111111-1111-4111-8111-111111111111',
  })
  groups = [...groups, group]
  members = [
    ...members,
    makeMember({
      group_id: group.id,
      user_id: session?.user.id ?? '55555555-5555-4555-8555-555555555555',
      role: 'member',
      display_name: profile?.display_name ?? 'Member B',
    }),
  ]
  return {
    data: [{ group_id: invite.group_id, already_member: false }],
    error: null,
  }
}

async function revokeInviteImpl(args: { p_invite_id: string }) {
  if (revokeError) {
    return { data: null, error: revokeError }
  }

  const invite = invites.find((item) => item.id === args.p_invite_id)
  if (!invite) {
    return {
      data: null,
      error: { code: '22023', message: 'Invite not found' },
    }
  }

  if (!isOwnerOf(invite.group_id)) {
    return {
      data: null,
      error: { code: '42501', message: 'Only owners can revoke invites' },
    }
  }

  invite.revoked_at = new Date().toISOString()
  invite.token = null
  return { data: null, error: null }
}

async function deleteInviteImpl(args: { p_invite_id: string }) {
  if (deleteInviteError) {
    return { data: null, error: deleteInviteError }
  }

  const index = invites.findIndex((item) => item.id === args.p_invite_id)
  if (index === -1) {
    return {
      data: null,
      error: { code: '22023', message: 'Invite not found' },
    }
  }

  const invite = invites[index]
  if (!invite) {
    return {
      data: null,
      error: { code: '22023', message: 'Invite not found' },
    }
  }

  if (!isOwnerOf(invite.group_id)) {
    return {
      data: null,
      error: { code: '42501', message: 'Only owners can delete invites' },
    }
  }

  if (!invite.revoked_at) {
    return {
      data: null,
      error: { code: '22023', message: 'Only revoked invites can be deleted' },
    }
  }

  invites.splice(index, 1)
  return { data: null, error: null }
}

async function leaveGroupImpl(args: { p_group_id: string }) {
  if (leaveGroupError) {
    return { data: null, error: leaveGroupError }
  }

  if (!session) {
    return {
      data: null,
      error: { code: '42501', message: 'Not authenticated' },
    }
  }

  const membership = members.find(
    (member) =>
      member.group_id === args.p_group_id && member.user_id === session?.user.id,
  )

  if (!membership) {
    return {
      data: null,
      error: { code: '42501', message: 'Not a group member' },
    }
  }

  if (membership.role === 'owner') {
    return {
      data: null,
      error: {
        code: '42501',
        message: 'Transfer ownership or delete the group before leaving',
      },
    }
  }

  members = members.filter(
    (member) =>
      !(
        member.group_id === args.p_group_id &&
        member.user_id === session?.user.id
      ),
  )
  groups = groups.filter((group) => group.id !== args.p_group_id)
  return { data: null, error: null }
}

async function transferOwnershipImpl(args: {
  p_group_id: string
  p_new_owner_id: string
}) {
  if (transferOwnershipError) {
    return { data: null, error: transferOwnershipError }
  }

  if (!session || !isOwnerOf(args.p_group_id)) {
    return {
      data: null,
      error: { code: '42501', message: 'Only the owner can transfer ownership' },
    }
  }

  const nextOwner = members.find(
    (member) =>
      member.group_id === args.p_group_id &&
      member.user_id === args.p_new_owner_id,
  )

  if (!nextOwner) {
    return {
      data: null,
      error: { code: '22023', message: 'New owner must already be a group member' },
    }
  }

  members = members.map((member) => {
    if (member.group_id !== args.p_group_id) {
      return member
    }

    if (member.user_id === session?.user.id) {
      return { ...member, role: 'member' as const }
    }

    if (member.user_id === args.p_new_owner_id) {
      return { ...member, role: 'owner' as const }
    }

    return member
  })
  groups = groups.map((group) =>
    group.id === args.p_group_id
      ? { ...group, owner_id: args.p_new_owner_id }
      : group,
  )
  return { data: null, error: null }
}

function timestampsForStatus(
  status: TitleStatus,
  existing: MockTitleProgress | undefined,
): { started_at: string | null; watched_at: string | null } {
  const now = new Date().toISOString()

  if (status === 'not_started') {
    return { started_at: null, watched_at: null }
  }

  if (status === 'watching') {
    return { started_at: existing?.started_at ?? now, watched_at: null }
  }

  return {
    started_at: existing?.started_at ?? now,
    watched_at: existing?.watched_at ?? now,
  }
}

function matchesProgressFilters(
  row: MockTitleProgress,
  filters: Record<string, string>,
): boolean {
  return Object.entries(filters).every(([column, value]) => {
    if (column === 'group_id') {
      return row.group_id === value
    }

    if (column === 'user_id') {
      return row.user_id === value
    }

    if (column === 'title_id') {
      return row.title_id === value
    }

    return true
  })
}

export const supabaseChannelMock = {
  channel: vi.fn((name: string) => {
    activeRealtimeChannelNames.add(name)

    const api = {
      channelName: name,
      on(
        _event: string,
        filter: { table: string },
        callback: () => void,
      ) {
        realtimeHandlers.push({
          table: filter.table,
          channelName: name,
          callback,
        })
        return api
      },
      subscribe: vi.fn(() => api),
    }

    return api
  }),
  removeChannel: vi.fn(async (channel: { channelName?: string }) => {
    if (channel.channelName) {
      activeRealtimeChannelNames.delete(channel.channelName)

      for (let index = realtimeHandlers.length - 1; index >= 0; index -= 1) {
        if (realtimeHandlers[index]?.channelName === channel.channelName) {
          realtimeHandlers.splice(index, 1)
        }
      }
    }

    return 'ok'
  }),
}

export function getActiveRealtimeChannelNames(): string[] {
  return [...activeRealtimeChannelNames]
}

export function emitRealtimeChange(table: string): void {
  for (const handler of realtimeHandlers) {
    if (handler.table === table) {
      handler.callback()
    }
  }
}

export function clearRealtimeHandlers(): void {
  realtimeHandlers.length = 0
}

export const supabaseAuthMock = {
  getSession: vi.fn(async () => ({ data: { session }, error: null })),
  onAuthStateChange: vi.fn((callback: AuthListener) => {
    listeners.add(callback)
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            listeners.delete(callback)
          },
        },
      },
    }
  }),
  signInWithPassword: vi.fn(async (): Promise<AuthResponse> => ({
    data: { session, user: session?.user ?? null },
    error: null,
  })),
  signUp: vi.fn(async (): Promise<AuthResponse> => ({
    data: { session, user: session?.user ?? null },
    error: null,
  })),
  signOut: vi.fn(async () => {
    profile = null
    groups = []
    invites = []
    emitAuthEvent('SIGNED_OUT', null)
    return { error: null }
  }),
  resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
  updateUser: vi.fn(async () => ({
    data: { user: session?.user ?? null },
    error: null,
  })),
}

export const supabaseRpcMock = {
  create_group: vi.fn(createGroupImpl),
  create_invite: vi.fn(createInviteImpl),
  preview_invite: vi.fn(previewInviteImpl),
  redeem_invite: vi.fn(redeemInviteImpl),
  revoke_invite: vi.fn(revokeInviteImpl),
  delete_invite: vi.fn(deleteInviteImpl),
  leave_group: vi.fn(leaveGroupImpl),
  transfer_ownership: vi.fn(transferOwnershipImpl),
}

export const supabaseFromMock = vi.fn((table: string) => {
  if (table === 'notification_preferences') {
    const emptyPrefs = (userId: string) => ({
      user_id: userId,
      member_joined: true,
      member_watched: true,
      member_rated: true,
      member_reviewed: true,
      group_ready_for_next_title: true,
      daily_countdown: false,
      last_daily_countdown_sent_on: null,
      updated_at: new Date().toISOString(),
    })

    return {
      select: () => ({
        eq: (_column: string, userId: string) => ({
          maybeSingle: async () => ({
            data: notificationPreferences[userId] ?? emptyPrefs(userId),
            error: null,
          }),
        }),
      }),
      insert: (values: { user_id: string }) => {
        const created = emptyPrefs(values.user_id)
        notificationPreferences[values.user_id] = created
        return {
          select: () => ({
            single: async () => ({ data: created, error: null }),
          }),
        }
      },
      upsert: (values: {
        user_id: string
        daily_countdown?: boolean
        member_joined?: boolean
        member_watched?: boolean
        member_rated?: boolean
        member_reviewed?: boolean
        group_ready_for_next_title?: boolean
      }) => {
        const next = {
          ...(notificationPreferences[values.user_id] ?? emptyPrefs(values.user_id)),
          ...values,
          updated_at: new Date().toISOString(),
        }
        notificationPreferences[values.user_id] = next
        return {
          select: () => ({
            single: async () => ({ data: next, error: null }),
          }),
        }
      },
    }
  }

  if (table === 'push_subscriptions') {
    return {
      select: () => ({
        eq: () =>
          Promise.resolve({
            data: [],
            count: pushSubscriptionCount,
            error: null,
          }),
      }),
      upsert: async () => ({ data: null, error: null }),
      delete: () => ({
        eq: () => ({
          eq: async () => ({ data: null, error: null }),
        }),
      }),
    }
  }

  if (table === 'profiles') {
    return {
      select: () => ({
        eq: () => ({
          maybeSingle: async () =>
            profileError
              ? { data: null, error: profileError }
              : { data: profile, error: null },
        }),
      }),
      update: (values: {
        display_name?: string
        avatar_url?: string | null
      }) => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => {
              if (profile) {
                profile = {
                  ...profile,
                  ...(values.display_name
                    ? { display_name: values.display_name }
                    : {}),
                  ...(values.avatar_url !== undefined
                    ? { avatar_url: values.avatar_url }
                    : {}),
                }
              }

              return { data: profile, error: null }
            },
          }),
        }),
      }),
    }
  }

  if (table === 'groups') {
    return {
      select: () => ({
        order: async () =>
          groupsError
            ? { data: null, error: groupsError }
            : { data: groups, error: null },
        eq: (_column: string, value: string) => ({
          maybeSingle: async () =>
            groupsError
              ? { data: null, error: groupsError }
              : {
                  data: groups.find((group) => group.id === value) ?? null,
                  error: null,
                },
        }),
      }),
      update: (values: Partial<GroupRow>) => ({
        eq: (_column: string, groupId: string) => ({
          select: () => ({
            maybeSingle: async () => {
              const group = groups.find((item) => item.id === groupId)

              if (
                groupWriteError ||
                !group ||
                !session ||
                group.owner_id !== session.user.id
              ) {
                return {
                  data: null,
                  error: groupWriteError ?? {
                    code: '42501',
                    message: 'Only owners can update this group',
                  },
                }
              }

              const next = {
                ...group,
                ...values,
                updated_at: new Date().toISOString(),
              }
              groups = groups.map((item) =>
                item.id === groupId ? next : item,
              )
              return { data: next, error: null }
            },
          }),
        }),
      }),
      delete: () => ({
        eq: async (_column: string, groupId: string) => {
          if (groupWriteError) {
            return { data: null, error: groupWriteError }
          }

          if (!session || !isOwnerOf(groupId)) {
            return {
              data: null,
              error: {
                code: '42501',
                message: 'Only owners can delete this group',
              },
            }
          }

          groups = groups.filter((group) => group.id !== groupId)
          members = members.filter((member) => member.group_id !== groupId)
          return { data: null, error: null }
        },
      }),
    }
  }

  if (table === 'group_members') {
    const deleteFilters: Record<string, string> = {}
    const deleteApi = {
      eq(column: string, value: string) {
        deleteFilters[column] = value
        return deleteApi
      },
      then(
        onFulfilled?: (value: {
          data: null
          error: { code?: string; message: string } | null
        }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        const groupId = deleteFilters.group_id
        const userId = deleteFilters.user_id

        if (groupWriteError) {
          return Promise.resolve({ data: null, error: groupWriteError }).then(
            onFulfilled,
            onRejected,
          )
        }

        if (!session || !groupId || !userId || !isOwnerOf(groupId) || userId === session.user.id) {
          return Promise.resolve({
            data: null,
            error: {
              code: '42501',
              message: 'Only owners can remove other members',
            },
          }).then(onFulfilled, onRejected)
        }

        members = members.filter(
          (member) =>
            !(member.group_id === groupId && member.user_id === userId),
        )
        return Promise.resolve({ data: null, error: null }).then(
          onFulfilled,
          onRejected,
        )
      },
    }

    return {
      select: () => ({
        in: async (_column: string, groupIds: string[]) => {
          if (membersError) {
            return { data: null, error: membersError }
          }

          const allowed = new Set(groupIds)

          return {
            data: members
              .filter((member) => allowed.has(member.group_id))
              .map(memberToRow),
            error: null,
          }
        },
      }),
      delete: () => deleteApi,
    }
  }

  if (table === 'group_invites') {
    return {
      select: () => ({
        eq: (_column: string, groupId: string) => ({
          order: async () => {
            if (invitesError) {
              return { data: null, error: invitesError }
            }

            if (!isOwnerOf(groupId)) {
              return { data: [], error: null }
            }

            return {
              data: invites
                .filter((invite) => invite.group_id === groupId)
                .map(inviteToRow),
              error: null,
            }
          },
        }),
      }),
    }
  }

  if (table === 'titles') {
    return {
      select: () => ({
        eq: (column: string, value: string | boolean) => ({
          order: async () => {
            if (titlesError) {
              return { data: null, error: titlesError }
            }

            return {
              data: titles.filter((title) => {
                if (column === 'is_active') {
                  return title.is_active === value
                }

                return true
              }),
              error: null,
            }
          },
          maybeSingle: async () => {
            if (titlesError) {
              return { data: null, error: titlesError }
            }

            const title =
              column === 'id'
                ? (titles.find((row) => row.id === value) ?? null)
                : null

            return { data: title, error: null }
          },
        }),
      }),
    }
  }

  if (table === 'member_title_progress') {
    const filters: Record<string, string> = {}
    const selectApi = {
      eq(column: string, value: string) {
        filters[column] = value
        return selectApi
      },
      then(
        onFulfilled?: (value: {
          data: MockTitleProgress[] | null
          error: { message: string } | null
        }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        const result = progressError
          ? { data: null, error: progressError }
          : {
              data: progress.filter((row) =>
                matchesProgressFilters(row, filters),
              ),
              error: null,
            }

        return Promise.resolve(result).then(onFulfilled, onRejected)
      },
    }

    const deleteApi = {
      eq(column: string, value: string) {
        filters[column] = value
        return deleteApi
      },
      then(
        onFulfilled?: (value: {
          data: null
          error: { code?: string; message: string } | null
        }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        if (progressWriteError) {
          return Promise.resolve({
            data: null,
            error: progressWriteError,
          }).then(onFulfilled, onRejected)
        }

        progress = progress.filter(
          (row) => !matchesProgressFilters(row, filters),
        )
        return Promise.resolve({ data: null, error: null }).then(
          onFulfilled,
          onRejected,
        )
      },
    }

    return {
      select: () => selectApi,
      delete: () => deleteApi,
      upsert: (values: {
        group_id: string
        user_id: string
        title_id: string
        status: TitleStatus
      }) => ({
        select: () => ({
          maybeSingle: async () => {
            if (progressWriteError) {
              return { data: null, error: progressWriteError }
            }

            const existing = progress.find(
              (row) =>
                row.group_id === values.group_id &&
                row.user_id === values.user_id &&
                row.title_id === values.title_id,
            )
            const row: MockTitleProgress = {
              ...values,
              ...timestampsForStatus(values.status, existing),
            }
            progress = [
              ...progress.filter(
                (item) =>
                  !(
                    item.group_id === row.group_id &&
                    item.user_id === row.user_id &&
                    item.title_id === row.title_id
                  ),
              ),
              row,
            ]
            return { data: row, error: null }
          },
        }),
      }),
    }
  }

  if (table === 'reviews') {
    const filters: Record<string, string> = {}
    const selectApi = {
      eq(column: string, value: string) {
        filters[column] = value
        return selectApi
      },
      order: async () => {
        if (reviewsError) {
          return { data: null, error: reviewsError }
        }

        return {
          data: reviews.filter((row) =>
            Object.entries(filters).every(
              ([column, value]) =>
                row[column as keyof ReviewRow] === value,
            ),
          ),
          error: null,
        }
      },
    }

    const deleteFilters: Record<string, string> = {}
    const deleteApi = {
      eq(column: string, value: string) {
        deleteFilters[column] = value
        return deleteApi
      },
      then(
        onFulfilled?: (value: {
          data: null
          error: { code?: string; message: string } | null
        }) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) {
        if (reviewWriteError) {
          return Promise.resolve({
            data: null,
            error: reviewWriteError,
          }).then(onFulfilled, onRejected)
        }

        reviews = reviews.filter((row) => {
          const idMatch = !deleteFilters.id || row.id === deleteFilters.id
          const userMatch =
            !deleteFilters.user_id || row.user_id === deleteFilters.user_id
          return !(idMatch && userMatch && Boolean(deleteFilters.id))
        })
        return Promise.resolve({ data: null, error: null }).then(
          onFulfilled,
          onRejected,
        )
      },
    }

    return {
      select: () => selectApi,
      insert: (values: {
        group_id: string
        user_id: string
        title_id: string
        rating: number
        body: string | null
        contains_spoilers: boolean
      }) => ({
        select: () => ({
          maybeSingle: async () => {
            if (reviewWriteError) {
              return { data: null, error: reviewWriteError }
            }

            const ratingOk =
              Number.isFinite(values.rating) &&
              values.rating >= 1 &&
              values.rating <= 10 &&
              Math.abs(values.rating * 2 - Math.round(values.rating * 2)) < 1e-8
            const bodyOk =
              values.body === null || values.body.length <= 2000

            if (!ratingOk || !bodyOk) {
              return {
                data: null,
                error: { code: '23514', message: 'check violation' },
              }
            }

            const duplicate = reviews.some(
              (row) =>
                row.group_id === values.group_id &&
                row.user_id === values.user_id &&
                row.title_id === values.title_id,
            )

            if (duplicate) {
              return {
                data: null,
                error: { code: '23505', message: 'duplicate' },
              }
            }

            const row = makeReview({
              id: crypto.randomUUID(),
              ...values,
            })
            reviews = [...reviews, row]
            return { data: row, error: null }
          },
        }),
      }),
      update: (values: Partial<ReviewRow>) => {
        const updateFilters: Record<string, string> = {}
        const updateApi = {
          eq(column: string, value: string) {
            updateFilters[column] = value
            return updateApi
          },
          select: () => ({
            maybeSingle: async () => {
              if (reviewWriteError) {
                return { data: null, error: reviewWriteError }
              }

              const ratingOk =
                values.rating === undefined ||
                (Number.isFinite(values.rating) &&
                  values.rating >= 1 &&
                  values.rating <= 10 &&
                  Math.abs(
                    values.rating * 2 - Math.round(values.rating * 2),
                  ) < 1e-8)
              const bodyOk =
                values.body === undefined ||
                values.body === null ||
                values.body.length <= 2000

              if (!ratingOk || !bodyOk) {
                return {
                  data: null,
                  error: { code: '23514', message: 'check violation' },
                }
              }

              const current = reviews.find(
                (row) =>
                  (!updateFilters.id || row.id === updateFilters.id) &&
                  (!updateFilters.user_id ||
                    row.user_id === updateFilters.user_id),
              )

              if (!current) {
                return { data: null, error: null }
              }

              const next = {
                ...current,
                ...values,
                updated_at: new Date().toISOString(),
              }
              reviews = reviews.map((row) =>
                row.id === current.id ? next : row,
              )
              return { data: next, error: null }
            },
          }),
        }

        return updateApi
      },
      delete: () => deleteApi,
    }
  }

  throw new Error(`Unexpected table ${table}`)
})

export function getSupabaseClient() {
  return {
    auth: supabaseAuthMock,
    from: supabaseFromMock,
    channel: supabaseChannelMock.channel,
    removeChannel: supabaseChannelMock.removeChannel,
    rpc(fn: string, args: Record<string, unknown> = {}) {
      if (fn === 'create_group') {
        return supabaseRpcMock.create_group(
          args as { p_name: string; p_description?: string },
        )
      }

      if (fn === 'create_invite') {
        return supabaseRpcMock.create_invite(
          args as {
            p_group_id: string
            p_expires_at?: string
            p_max_uses?: number
          },
        )
      }

      if (fn === 'preview_invite') {
        return supabaseRpcMock.preview_invite(args as { p_token: string })
      }

      if (fn === 'redeem_invite') {
        return supabaseRpcMock.redeem_invite(args as { p_token: string })
      }

      if (fn === 'revoke_invite') {
        return supabaseRpcMock.revoke_invite(args as { p_invite_id: string })
      }

      if (fn === 'delete_invite') {
        return supabaseRpcMock.delete_invite(args as { p_invite_id: string })
      }

      if (fn === 'leave_group') {
        return supabaseRpcMock.leave_group(args as { p_group_id: string })
      }

      if (fn === 'transfer_ownership') {
        return supabaseRpcMock.transfer_ownership(
          args as { p_group_id: string; p_new_owner_id: string },
        )
      }

      throw new Error(`Unexpected rpc ${fn}`)
    },
  }
}

export function resetSupabaseClient(): void {
  session = null
  profile = null
  profileError = null
  groups = []
  groupsError = null
  createGroupError = null
  members = []
  membersError = null
  invites = []
  invitesError = null
  createInviteError = null
  previewError = null
  redeemError = null
  revokeError = null
  deleteInviteError = null
  titles = []
  titlesError = null
  progress = []
  progressError = null
  progressWriteError = null
  reviews = []
  reviewsError = null
  reviewWriteError = null
  groupWriteError = null
  leaveGroupError = null
  transferOwnershipError = null
  notificationPreferences = {}
  pushSubscriptionCount = 0
  listeners.clear()
  realtimeHandlers.length = 0
  activeRealtimeChannelNames.clear()
}

export function resetSupabaseMock(): void {
  resetSupabaseClient()
  supabaseAuthMock.getSession.mockClear()
  supabaseAuthMock.onAuthStateChange.mockClear()
  supabaseAuthMock.signInWithPassword.mockClear()
  supabaseAuthMock.signUp.mockClear()
  supabaseAuthMock.signOut.mockClear()
  supabaseAuthMock.resetPasswordForEmail.mockClear()
  supabaseAuthMock.updateUser.mockClear()
  supabaseFromMock.mockClear()
  supabaseChannelMock.channel.mockClear()
  supabaseChannelMock.removeChannel.mockClear()
  supabaseRpcMock.create_group.mockReset()
  supabaseRpcMock.create_group.mockImplementation(createGroupImpl)
  supabaseRpcMock.create_invite.mockReset()
  supabaseRpcMock.create_invite.mockImplementation(createInviteImpl)
  supabaseRpcMock.preview_invite.mockReset()
  supabaseRpcMock.preview_invite.mockImplementation(previewInviteImpl)
  supabaseRpcMock.redeem_invite.mockReset()
  supabaseRpcMock.redeem_invite.mockImplementation(redeemInviteImpl)
  supabaseRpcMock.revoke_invite.mockReset()
  supabaseRpcMock.revoke_invite.mockImplementation(revokeInviteImpl)
  supabaseRpcMock.delete_invite.mockReset()
  supabaseRpcMock.delete_invite.mockImplementation(deleteInviteImpl)
  supabaseRpcMock.leave_group.mockReset()
  supabaseRpcMock.leave_group.mockImplementation(leaveGroupImpl)
  supabaseRpcMock.transfer_ownership.mockReset()
  supabaseRpcMock.transfer_ownership.mockImplementation(transferOwnershipImpl)
}
