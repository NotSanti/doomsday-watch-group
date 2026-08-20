# Deployment

Doomsday Watch Group is a Vite SPA. GitHub is the source of truth; Vercel hosts the client; Supabase hosts Auth, Postgres, RLS, and Realtime. Secrets never belong in `vercel.json`, GitHub Actions YAML, or other tracked files.

## Environments

| Environment | App origin                                | Supabase                                        | How it deploys     |
| ----------- | ----------------------------------------- | ----------------------------------------------- | ------------------ |
| Local       | `http://127.0.0.1:5173`                   | `npx supabase start`                            | `npm run dev`      |
| Preview     | unique `https://$VERCEL_URL`              | hosted project (or a dedicated staging project) | every pull request |
| Production  | `https://doomwatchparty.vercel.app` | hosted project `mtnptgydaxcjycrrxyuz`           | merges to `main`   |

Prefer a separate Supabase project for preview when practical. Until that exists, preview and production may share the hosted project — never put a service-role or TMDB token in Vercel for either environment.

## Vercel project

- Framework: Vite (auto-detected).
- Build command: `npm run build`.
- Output: `dist/`.
- `vercel.json` rewrites unknown paths to `/index.html` so opening `/groups/:id/watchlist` directly works.
- Browser isolation headers (`X-Frame-Options`, `nosniff`, referrer policy) are set in `vercel.json`. No secrets.

Preview deployments use Vercel Deployment Protection, so the preview URL may require a Vercel login. After that, nested client routes still rewrite to the SPA. Production (`https://doomwatchparty.vercel.app`) is public.

Vercel system variables (`VERCEL_URL`, `VERCEL_ENV`) are provided by the platform. Do not copy them into git.

## Client environment variables

Set these in the Vercel dashboard by environment. Names only in git (see `.env.example`).

| Name                            | Production                                                 | Preview                                                         | Local                             |
| ------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------- |
| `VITE_APP_URL`                  | Canonical origin `https://doomwatchparty.vercel.app` | **Leave unset** so the Vite build derives `https://$VERCEL_URL` | `http://127.0.0.1:5173`           |
| `VITE_SUPABASE_URL`             | Hosted project URL                                         | Staging URL if available, otherwise hosted URL                  | `npx supabase status` → `API_URL` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Hosted publishable (anon) key                              | Matching preview project key                                    | `npx supabase status`             |

Production builds fail if `VITE_APP_URL` is missing so invite links and auth redirects cannot silently use a unique deployment hostname.

Never set on Vercel:

- `E2E_SUPABASE_SERVICE_ROLE_KEY`
- Supabase service-role / `sb_secret_` keys
- `TMDB_API_READ_TOKEN`
- `RESEND_API_KEY`

`TMDB_API_READ_TOKEN` stays in local/admin script environments only.

## Supabase Auth URLs

Hosted dashboard: [URL Configuration](https://supabase.com/dashboard/project/mtnptgydaxcjycrrxyuz/auth/url-configuration).

**Site URL** (default redirect, production):

```text
https://doomwatchparty.vercel.app
```

**Additional redirect URLs:**

```text
http://127.0.0.1:5173/**
http://localhost:5173/**
https://doomwatchparty.vercel.app/**
https://doomwatchparty-*.vercel.app/**
https://*-notsantis-projects.vercel.app/**
```

Do not allow `https://*.vercel.app/**` — that would accept auth redirects onto any Vercel app.

The client sends `emailRedirectTo` / `redirectTo` as `{VITE_APP_URL}/auth/callback`. Preview builds must therefore use that preview origin (leave `VITE_APP_URL` unset on Preview). If confirmation emails still land on the Site URL, switch the Auth email templates to `{{ .RedirectTo }}` instead of `{{ .SiteURL }}`.

Hosted confirmation and reset mail go through the **send-auth-email** Edge Function and **Resend templates**, not the Vite app. Setup: `docs/auth-email.md`. Never put `RESEND_API_KEY` in Vercel.

Local GoTrue reads `supabase/config.toml` (`site_url` and `additional_redirect_urls`). Restart `npx supabase start` after changing those values.

## Allowed origins

The browser talks to Supabase with the publishable key. Authorization is RLS plus membership RPCs, not origin hiding. Still:

- Register only the redirect URLs above.
- Keep the hosted Auth Site URL on the production origin.
- Do not add extra CORS exceptions for arbitrary sites.

## Database migrations

Migrations live in `supabase/migrations/` and are the only schema source of truth.

**Order (required):**

1. Apply SQL to the target database (`npx supabase db push` against the linked project, after reviewing the diff).
2. Confirm `npx supabase test db` still represents the intended policies (run locally).
3. Merge/promote the frontend that depends on those columns/RPCs.

Prefer backward-compatible changes: add columns/functions and deploy code that uses them, then remove unused objects in a later migration. GitHub Actions does **not** push migrations.

**Seed strategy:**

- Local reset loads `supabase/seed.sql` (fictional fixtures) and `supabase/seeds/catalog.sql`.
- Production catalog rows come from reviewed migrations (stable IDs). Do not run the fictional local seed against production.
- After a production push, spot-check title count and a known catalog ID.

**Rollback:**

- Frontend: in Vercel, promote the previous production deployment.
- Database: ship a new forward-fix migration. Do not rewrite or delete an already-applied file. Restoring a backup is the last resort and needs a matching frontend rollback.

## CI

Pull requests and `main` run `.github/workflows/ci.yml`:

1. Lint, typecheck, Vitest, production build, bundle secret scan, `npm audit --audit-level=high`.
2. Ephemeral local Supabase: database policy tests and Playwright.

CI uses dummy `VITE_*` values for the client build and local `npx supabase status` keys for E2E. No hosted secrets are required.

`npm run ci` matches the first job locally. `npm run verify` also runs Prettier; some existing files still fail `format:check` and are out of scope for this milestone.

## Smoke tests

Use `docs/release-checklist.md` after a preview deploy and before promoting production. The critical path is create group → invite → join → watch → review, plus opening a nested route directly.
