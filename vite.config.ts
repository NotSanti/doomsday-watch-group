import path from 'node:path'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
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
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['doom.svg', 'apple-touch-icon.png', 'doom.ico'],
      manifest: {
        name: 'Doom Watch Party',
        short_name: 'Doom Watch Party',
        description:
          'Private MCU watch group on the road to Avengers: Doomsday.',
        theme_color: '#0d1210',
        background_color: '#0d1210',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
          {
            src: '/doom.svg',
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
