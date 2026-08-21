# Agent working agreement

Doomsday Watch Group is built one numbered milestone at a time. Follow these rules on every change.

1. Work on exactly one numbered milestone at a time.
2. Before coding, inspect the existing repository and summarize the files that will change.
3. Do not implement later milestones pre-emptively.
4. Do not change an established dependency or architecture without explaining why.
5. Use strict TypeScript; do not introduce `any` to silence errors.
6. Validate external data with Zod at boundaries.
7. Keep secrets out of client code and git. Update `.env.example` with variable names only.
8. Every database table exposed to the browser needs grants and tested RLS.
9. Include loading, empty, error, and success states for every async screen.
10. Write or update tests with each behavior change.
11. At the end of a milestone, run lint, type-check, unit tests, and production build.
12. Report: files changed, migrations added, commands run, results, manual QA steps, and known limitations.
13. Stop after the milestone’s acceptance criteria pass and wait for approval, unless the user explicitly asked to continue.
14. Never copy code, proprietary copy, logos, or layouts from marvelwatchlist.com. Recreate only general product patterns with an original design.
15. Popups/dialogs: frosted glass (`bg-surface-elevated/70` + blur); centered modal on desktop (`md+`); full viewport on mobile with a corner close (X) unless `preventDismiss`. Put desktop-only sizing in `md:` classes. Use shared `DialogContent` unless there is a strong reason not to.

## Product constraints

- Working name: **Doomsday Watch Group**.
- Include: “Unofficial fan project. Not affiliated with or endorsed by Marvel or Disney.”
- Group membership is the authorization boundary. UI hiding is not authorization; RLS must enforce it.
- Store invite tokens for owner recopy (owner-only RLS). Look up redemption by hash. Clear the stored token on revoke. Redeem invites through an atomic backend function.
- Curated catalog titles use stable git-reviewed IDs. Build artwork URLs from stored TMDB paths.
- Never expose a Supabase service-role key or TMDB token in the Vite client bundle.
