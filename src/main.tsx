import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/app/router'
import { createQueryClient } from '@/app/query-client'
import { ErrorState } from '@/components/ErrorState'
import { CLIENT_ENV_ERROR, getClientEnv } from '@/lib/env'
import './index.css'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element #root was not found')
}

const queryClient = createQueryClient()

let envError: string | null = null

try {
  getClientEnv()
} catch {
  envError = CLIENT_ENV_ERROR
}

createRoot(rootElement).render(
  <StrictMode>
    {envError ? (
      <div className="mx-auto max-w-lg px-4 py-16">
        <ErrorState message={envError} />
      </div>
    ) : (
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    )}
  </StrictMode>,
)
