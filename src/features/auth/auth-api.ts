import { getClientEnv } from '@/lib/env'
import type { BrowserSupabaseClient } from '@/lib/supabase'
import {
  profileRowSchema,
  type ProfileRow,
  type SignInValues,
  type SignUpValues,
} from '@/features/auth/auth-schemas'
import {
  toAvatarUrl,
  type ProfileIconId,
} from '@/features/auth/profile-icons'

export const profileQueryKey = (userId: string) => ['profile', userId] as const

const PROFILE_COLUMNS = 'id, display_name, avatar_url, created_at, updated_at'

export async function fetchOwnProfile(
  client: BrowserSupabaseClient,
  userId: string,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle()

  if (error || !data) {
    throw error ?? new Error('PROFILE_MISSING')
  }

  return profileRowSchema.parse(data)
}

export async function updateDisplayName(
  client: BrowserSupabaseClient,
  userId: string,
  displayName: string,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (error || !data) {
    throw error ?? new Error('PROFILE_UPDATE_FAILED')
  }

  return profileRowSchema.parse(data)
}

export async function updateAvatarIcon(
  client: BrowserSupabaseClient,
  userId: string,
  iconId: ProfileIconId,
): Promise<ProfileRow> {
  const { data, error } = await client
    .from('profiles')
    .update({ avatar_url: toAvatarUrl(iconId) })
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .maybeSingle()

  if (error || !data) {
    throw error ?? new Error('PROFILE_UPDATE_FAILED')
  }

  return profileRowSchema.parse(data)
}

export async function signInWithPassword(
  client: BrowserSupabaseClient,
  values: SignInValues,
) {
  return client.auth.signInWithPassword({
    email: values.email,
    password: values.password,
  })
}

export async function signUpWithPassword(
  client: BrowserSupabaseClient,
  values: SignUpValues,
) {
  const env = getClientEnv()

  return client.auth.signUp({
    email: values.email,
    password: values.password,
    options: {
      data: { display_name: values.displayName },
      emailRedirectTo: `${env.VITE_APP_URL}/auth/callback`,
    },
  })
}

export async function requestPasswordReset(
  client: BrowserSupabaseClient,
  email: string,
) {
  const env = getClientEnv()

  return client.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.VITE_APP_URL}/auth/callback?next=${encodeURIComponent('/auth?mode=update-password')}`,
  })
}

export async function updatePassword(
  client: BrowserSupabaseClient,
  password: string,
) {
  return client.auth.updateUser({ password })
}

export async function signOut(client: BrowserSupabaseClient) {
  return client.auth.signOut()
}
