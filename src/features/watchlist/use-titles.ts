import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/use-auth'
import { fetchTitle, listTitles } from '@/features/watchlist/title-api'
import { titleKeys } from '@/features/watchlist/title-keys'
import { isTitleId } from '@/features/watchlist/title-schemas'
import { getSupabaseClient } from '@/lib/supabase'

export function useTitleList() {
  const { user } = useAuth()

  return useQuery({
    queryKey: titleKeys.list(),
    queryFn: () => listTitles(getSupabaseClient()),
    enabled: Boolean(user),
  })
}

export function useTitle(titleId: string) {
  const { user } = useAuth()

  return useQuery({
    queryKey: titleKeys.detail(titleId),
    queryFn: () => fetchTitle(getSupabaseClient(), titleId),
    enabled: Boolean(user) && isTitleId(titleId),
  })
}
