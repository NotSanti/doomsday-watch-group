# Architecture

Doomsday Watch Group is a Vite SPA hosted on Vercel. Privileged writes go through Postgres functions and Row Level Security. The browser uses the Supabase publishable key only.

```mermaid
flowchart TD
    UI["React web app"] --> AUTH["Supabase Auth"]
    UI --> API["Supabase Data API"]
    API --> DB["Postgres + RLS"]
    UI --> FN["Protected functions"]
    FN --> DB
    FN --> TMDB["TMDB metadata"]
    VERCEL["Vercel"] --> UI
```

## Authorization

A signed-in user must not read or mutate any group-owned row unless they have an active membership in that group. Helper functions (`is_group_member`, `is_group_owner`, `current_user_is_membership`) back RLS. Group creation, invite redemption, and ownership transfer are atomic database functions.

## Client layout

```text
src/
  app/                 # router, providers, query client
  components/          # shared UI primitives
  features/
    auth/
    groups/
    invites/
    watchlist/
    progress/
    reviews/
    members/
    activity/
  layouts/
  pages/
  lib/                 # Supabase client, env parsing, utilities
  hooks/
  types/
  test/
supabase/
  migrations/
  seed.sql
public/
```

Keep database access in feature query/mutation modules. After schema changes, regenerate TypeScript types:

```bash
npx supabase gen types --local --lang=typescript > src/types/database.ts
```

Local database:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
```

## Environment

Documented in `.env.example`:

- `VITE_APP_URL` — public origin
- `VITE_SUPABASE_URL` — project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — anon/publishable key
- `TMDB_API_READ_TOKEN` — server/script only

## Hosting

- GitHub is the source of truth: https://github.com/NotSanti/doomsday-watch-group
- Production: https://doomsday-watch-group.vercel.app
- Vercel deploys `main` to production and pull requests to preview URLs.
- `vercel.json` rewrites unknown paths to `index.html` so React Router nested URLs work.
- Register local, preview, and production auth callback URLs in Supabase (Milestone 3 / 12).
  Local callback: `http://127.0.0.1:5173/auth/callback`
