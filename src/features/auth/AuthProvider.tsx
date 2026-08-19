import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchOwnProfile,
  profileQueryKey,
  signOut as signOutRequest,
} from '@/features/auth/auth-api'
import { AuthContext, type ProfileStatus } from '@/features/auth/auth-context'
import { toFriendlyProfileError } from '@/features/auth/auth-errors'
import { needsDisplayNameOnboarding } from '@/features/auth/auth-schemas'
import { removeAllRealtimeChannels } from '@/lib/realtime'
import { getSupabaseClient } from '@/lib/supabase'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<
    'loading' | 'anonymous' | 'authenticated'
  >('loading')
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    const client = getSupabaseClient()
    let cancelled = false

    void client.auth.getSession().then(({ data }) => {
      if (cancelled) {
        return
      }

      setSession(data.session)
      setStatus(data.session ? 'authenticated' : 'anonymous')
    })

    const { data } = client.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'anonymous')

      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true)
      }

      if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false)
        void removeAllRealtimeChannels(client)
        queryClient.clear()
      }

      if (event === 'USER_UPDATED') {
        setIsPasswordRecovery(false)
      }
    })

    return () => {
      cancelled = true
      data.subscription.unsubscribe()
    }
  }, [queryClient])

  const userId = session?.user.id
  const profileQuery = useQuery({
    queryKey: userId ? profileQueryKey(userId) : ['profile', 'anonymous'],
    queryFn: () => fetchOwnProfile(getSupabaseClient(), userId ?? ''),
    enabled: Boolean(userId),
  })

  const refreshProfile = useCallback(async () => {
    if (!userId) {
      return
    }

    await queryClient.invalidateQueries({ queryKey: profileQueryKey(userId) })
  }, [queryClient, userId])

  const handleSignOut = useCallback(async () => {
    const client = getSupabaseClient()
    await signOutRequest(client)
    await removeAllRealtimeChannels(client)
    queryClient.clear()
    setSession(null)
    setStatus('anonymous')
    setIsPasswordRecovery(false)
  }, [queryClient])

  const value = useMemo(() => {
    const profile = profileQuery.data ?? null
    let profileStatus: ProfileStatus = 'idle'

    if (userId) {
      if (profileQuery.isPending) {
        profileStatus = 'loading'
      } else if (profileQuery.isError) {
        profileStatus = 'error'
      } else {
        profileStatus = 'success'
      }
    }

    return {
      status,
      session,
      user: session?.user ?? null,
      profile,
      profileStatus,
      profileError: profileQuery.isError ? toFriendlyProfileError() : null,
      needsOnboarding: Boolean(
        profile && needsDisplayNameOnboarding(profile.display_name),
      ),
      isPasswordRecovery,
      refreshProfile,
      signOut: handleSignOut,
    }
  }, [
    handleSignOut,
    isPasswordRecovery,
    profileQuery.data,
    profileQuery.isError,
    profileQuery.isPending,
    refreshProfile,
    session,
    status,
    userId,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
