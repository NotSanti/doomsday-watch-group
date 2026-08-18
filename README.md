# Doomsday Watch Group

Private, invite-based MCU watch-group app. Friends share a curated watch order, track progress, and compare ratings on the road to _Avengers: Doomsday_.

Unofficial fan project. Not affiliated with or endorsed by Marvel or Disney.

## Stack

- Frontend: Vite, React, TypeScript
- Routing: React Router (from Milestone 1)
- Styling: Tailwind CSS + shadcn/ui (from Milestone 1)
- Remote state: TanStack Query (from Milestone 3)
- Forms: React Hook Form + Zod (from Milestone 3)
- Backend: Supabase (Postgres, Auth, RLS, Realtime)
- Tests: Vitest, React Testing Library, Playwright
- Hosting: Vercel
- CI: GitHub Actions (Milestone 12)

## Links

- GitHub: https://github.com/NotSanti/doomsday-watch-group
- Vercel production: https://doomsday-watch-group.vercel.app

## Local setup

```bash
npm install
cp .env.example .env
npx supabase start
npx supabase db reset
npm run dev
```

Copy `API_URL` into `VITE_SUPABASE_URL` and the anon/publishable key into `VITE_SUPABASE_PUBLISHABLE_KEY`. Set `VITE_APP_URL` to `http://127.0.0.1:5173`. Restart local Supabase after `config.toml` auth URL changes so callback links work.

Auth emails are not sent on the public internet. Open Mailpit at `http://127.0.0.1:54324` for confirmation and password-reset messages.

Database commands:

```bash
npx supabase start
npx supabase db reset
npx supabase test db
npx supabase gen types --local --lang=typescript > src/types/database.ts
```

Required commands:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

Environment variable names only (values stay in `.env` / Vercel, never in git):

```
VITE_APP_URL
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
TMDB_API_READ_TOKEN
```

`TMDB_API_READ_TOKEN` is server/script-only. Do not prefix it with `VITE_`.

## Routes

| Route                              | Access        | Purpose                                 |
| ---------------------------------- | ------------- | --------------------------------------- |
| `/`                                | Public        | Landing, countdown, product explanation |
| `/auth`                            | Public        | Sign up, sign in, password reset        |
| `/auth/callback`                   | Public        | Auth email callback                     |
| `/invite/:token`                   | Public shell  | Validate invite and join                |
| `/app`                             | Authenticated | Group picker and create/join            |
| `/groups/:groupId`                 | Member        | Dashboard                               |
| `/groups/:groupId/watchlist`       | Member        | Ordered catalog                         |
| `/groups/:groupId/titles/:titleId` | Member        | Title detail                            |
| `/groups/:groupId/members`         | Member        | Member comparison                       |
| `/groups/:groupId/settings`        | Owner         | Group administration                    |
| `/profile`                         | Authenticated | Display name and account                |
| `/about`                           | Public        | Disclaimer, TMDB credit, privacy        |

## MVP boundaries

Build: email auth, private groups, owner invites, curated catalog, current title, per-member watch status, ratings/reviews, dashboard/members/settings, configurable countdown, responsive UI.

Do not build in MVP: public groups, chat/comments/reactions/notifications, multiple custom watchlists, calendar scheduling, streaming playback, native apps, global public reviews, scraping of third-party watchlist sites.

## Milestone checklist

- [x] 0 — GitHub repo and Vercel hosting
- [x] 1 — Design foundation and static route shell
- [x] 2 — Supabase schema, seed, and RLS
- [x] 3 — Authentication and profile onboarding
- [x] 4 — Group creation, switcher, membership
- [x] 5 — Secure invitations
- [ ] 6 — Curated catalog and watchlist UI
- [ ] 7 — Personal progress and current title
- [ ] 8 — Ratings, reviews, spoiler protection
- [ ] 9 — Activity, members, and group administration
- [ ] 10 — Realtime polish
- [ ] 11 — End-to-end quality and security
- [ ] 12 — Production hardening and CI

Work one numbered milestone at a time. See `AGENTS.md` and `docs/architecture.md`.
