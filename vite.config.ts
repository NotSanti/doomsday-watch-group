import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { applyViteAppUrl } from './src/lib/resolve-app-url.ts'

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

applyViteAppUrl(process.env)

export default defineConfig({
  root: rootDir,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
})
