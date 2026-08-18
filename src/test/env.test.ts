import { describe, expect, it } from 'vitest'
import { CLIENT_ENV_ERROR, parseClientEnv } from '@/lib/env'

describe('parseClientEnv', () => {
  it('accepts public Vite environment values', () => {
    const env = parseClientEnv({
      VITE_APP_URL: 'http://127.0.0.1:5173',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
    })

    expect(env.VITE_APP_URL).toBe('http://127.0.0.1:5173')
  })

  it('hides missing values behind a configuration message', () => {
    expect(() =>
      parseClientEnv({
        VITE_APP_URL: '',
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      }),
    ).toThrow(CLIENT_ENV_ERROR)
  })
})
