import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const distAssets = join('dist', 'assets')

/** Match likely embedded secrets, not library string literals. */
const forbiddenPatterns = [
  {
    label: 'Supabase service-role JWT',
    pattern: /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*service_role/i,
  },
  {
    label: 'TMDB server token assignment',
    pattern: /TMDB_API_READ_TOKEN\s*[:=]\s*['"][^'"]+['"]/,
  },
  {
    label: 'Supabase secret key assignment',
    pattern: /sb_secret_[A-Za-z0-9_-]{20,}/,
  },
]

function scanBundle() {
  const failures = []
  const files = readdirSync(distAssets).filter((file) => file.endsWith('.js'))

  for (const file of files) {
    const content = readFileSync(join(distAssets, file), 'utf8')

    for (const rule of forbiddenPatterns) {
      if (rule.pattern.test(content)) {
        failures.push(`${rule.label} found in dist/assets/${file}`)
      }
    }
  }

  return failures
}

const failures = scanBundle()

if (failures.length > 0) {
  console.error('Client bundle secret scan failed:')
  for (const failure of failures) {
    console.error(`- ${failure}`)
  }
  process.exit(1)
}

console.log('Client bundle secret scan passed.')
