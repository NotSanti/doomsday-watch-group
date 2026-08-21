import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { applyViteAppUrl } from './src/lib/resolve-app-url.ts'

const packageJson = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string }

const appGitSha = (
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GITHUB_SHA ??
  'local'
).slice(0, 7)

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
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_GIT_SHA__: JSON.stringify(appGitSha),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'doomWatchPartyLogo.svg',
        'apple-touch-icon.png',
        'pwa-icon-512.png',
      ],
      manifest: {
        name: 'Doom Watch Party',
        short_name: 'Doom Watch Party',
        description:
          'Private MCU watch group on the road to Avengers: Doomsday.',
        theme_color: '#0d1210',
        background_color: '#0d1210',
        display: 'standalone',
        start_url: '/app',
        scope: '/',
        icons: [
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/doomWatchPartyLogo.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
})
