import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import { vi } from 'vitest'
import type { ProfileRow } from '@/features/auth/auth-schemas'

type AuthListener = (event: AuthChangeEvent, session: Session | null) => void

let session: Session | null = null
let profile: ProfileRow | null = null
let profileError: { message: string } | null = null
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
    emitAuthEvent('SIGNED_OUT', null)
    return { error: null }
  }),
  resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
  updateUser: vi.fn(async () => ({
    data: { user: session?.user ?? null },
    error: null,
  })),
}

export function getSupabaseClient() {
  return {
    auth: supabaseAuthMock,
    from(table: string) {
      if (table !== 'profiles') {
        throw new Error(`Unexpected table ${table}`)
      }

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
    },
  }
}

export function resetSupabaseClient(): void {
  session = null
  profile = null
  profileError = null
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
}
