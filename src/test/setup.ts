import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'
import { resetSupabaseMock } from '@/test/supabase-mock'

expect.extend(matchers)

vi.mock('@/lib/supabase', async () => await import('@/test/supabase-mock'))

class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

globalThis.ResizeObserver = ResizeObserverStub

afterEach(() => {
  cleanup()
  resetSupabaseMock()
})
