import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

function withWindowsDriveCase(filePath: string): string {
  return filePath.replace(
    /^([a-zA-Z]):/,
    (_, letter: string) => `${letter.toUpperCase()}:`,
  )
}

if (process.platform === 'win32') {
  const cwd = withWindowsDriveCase(process.cwd())
  if (cwd !== process.cwd()) {
    process.chdir(cwd)
  }
}

const rootDir = withWindowsDriveCase(
  path.dirname(fileURLToPath(import.meta.url)),
)

export default defineConfig({
  root: rootDir,
  define: {
    __APP_VERSION__: JSON.stringify('0.1.0'),
    __APP_GIT_SHA__: JSON.stringify('local'),
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'supabase'],
    testTimeout: 15_000,
    globals: true,
    env: {
      VITE_APP_URL: 'http://127.0.0.1:5173',
      VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
    },
  },
})
