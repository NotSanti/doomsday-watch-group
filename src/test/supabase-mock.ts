import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { ProfileRow } from '@/features/auth/auth-schemas'
import type { GroupRow } from '@/features/groups/group-schemas'

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void

let session: Session | null = null
let profile: ProfileRow | null = null
let profileError: { message: string } | null = null
let groups: GroupRow[] = []
let groupsError: { message: string } | null = null
let createGroupError: { code?: string; message: string } | null = null
const listeners = new Set<AuthListener>()

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
    avatar_url: null,
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
}

export function setCreateGroupError(
  error: { code?: string; message: string } | null,
): void {
  createGroupError = error
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

type CreateGroupArgs = {
  p_name: string
  p_description?: string
  p_target_date?: string
  p_timezone?: string
}

async function createGroupImpl(args: CreateGroupArgs) {
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
  return { data: group, error: null }
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
}

export const supabaseFromMock = vi.fn((table: string) => {
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
      update: (values: { display_name?: string }) => ({
        eq: () => ({
          select: () => ({
            maybeSingle: async () => {
              if (profile && values.display_name) {
                profile = { ...profile, display_name: values.display_name }
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
    }
  }

  throw new Error(`Unexpected table ${table}`)
})

export function getSupabaseClient() {
  return {
    auth: supabaseAuthMock,
    from: supabaseFromMock,
    rpc(fn: string, args: CreateGroupArgs) {
      if (fn === 'create_group') {
        return supabaseRpcMock.create_group(args)
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
  listeners.clear()
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
  supabaseRpcMock.create_group.mockReset()
  supabaseRpcMock.create_group.mockImplementation(createGroupImpl)
}
