import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { ProfileRow } from '@/features/auth/auth-schemas'

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated'
export type ProfileStatus = 'idle' | 'loading' | 'success' | 'error'

export type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  user: User | null
  profile: ProfileRow | null
  profileStatus: ProfileStatus
  profileError: string | null
  needsOnboarding: boolean
  needsAvatarOnboarding: boolean
  isPasswordRecovery: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
