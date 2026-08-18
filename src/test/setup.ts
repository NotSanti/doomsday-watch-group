import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { resetSupabaseMock } from '@/test/supabase-mock'

vi.mock('@/lib/supabase', async () => await import('@/test/supabase-mock'))

afterEach(() => {
  cleanup()
  resetSupabaseMock()
})
