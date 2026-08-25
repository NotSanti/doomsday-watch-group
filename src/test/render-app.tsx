import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { ReactElement } from 'react'
import { AppRoutes } from '@/app/router'
import { createQueryClient } from '@/app/query-client'
import { AuthProvider } from '@/features/auth/AuthProvider'

function locationEntry(
  path: string,
  state?: unknown,
): string | { pathname: string; search: string; state: unknown } {
  if (state === undefined) {
    return path
  }

  const [pathname = '/', search = ''] = path.split('?')
  return {
    pathname,
    search: search ? `?${search}` : '',
    state,
  }
}

export function renderApp(
  path: string,
  options?: { state?: unknown },
): ReturnType<typeof render> & {
  queryClient: ReturnType<typeof createQueryClient>
} {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({
    queries: { retry: false },
    mutations: { retry: false },
  })

  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[locationEntry(path, options?.state)]}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { ...view, queryClient }
}

export function renderAt(
  ui: ReactElement,
  path = '/',
): ReturnType<typeof render> {
  const queryClient = createQueryClient()
  queryClient.setDefaultOptions({ queries: { retry: false } })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
