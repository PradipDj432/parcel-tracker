# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Next.js dev server on :3000
npm run build        # Production build
npm start            # Start production server
npm run lint         # ESLint (eslint-config-next)
npm test             # Node unit tests (node --test tests/) — currently minimal
npm run test:e2e     # Run full Playwright suite
npm run test:e2e:ui  # Playwright interactive UI (for debugging)
```

Run a single Playwright test file or test by name:

```bash
npx playwright test e2e/tracking.spec.ts
npx playwright test -g "guest can track a parcel"
npx playwright test --headed          # see the browser
npx playwright test --debug           # inspector
```

Environment setup: copy `.env.example` → `.env.local`. All `NEXT_PUBLIC_*` vars are embedded at build time.

## Database migrations — run MANUALLY

Migrations in `supabase/migrations/` are **not** automated. After any migration change, the user (or you) must paste the SQL into the Supabase SQL Editor in order:

1. `001_initial_schema.sql` — tables, RLS, triggers, Realtime
2. `002_contact_subject.sql`
3. `003_fix_rls_recursion.sql` — critical; see gotcha below

When adding a new migration, create `004_*.sql` and tell the user to run it manually. Do not assume migrations have been applied on the user's Supabase project — ask if unsure.

## Architecture

### Route groups (App Router)

`src/app/` uses parenthesized route groups to share layouts + auth checks without affecting URLs:

- `(auth)/` — login/signup. Layout redirects authenticated users away.
- `(protected)/` — dashboard, history, import, profile. Layout redirects anon users to login.
- `(admin)/` — admin panel. Layout checks `profiles.role = 'admin'` server-side.

Public routes (`/track`, `/track/[id]`, `/contact`, `/`) live outside any group.

### Supabase clients — three flavors, pick the right one

- `src/lib/supabase/client.ts` — **browser** client (`@supabase/ssr`). Use in `"use client"` components.
- `src/lib/supabase/server.ts` — **server** client. Use in server components, route handlers, and server-side data fetching. Reads auth from cookies.
- `src/lib/supabase/middleware.ts` — session-refresh helper used by `src/proxy.ts` (Next.js middleware) to keep tokens fresh on every request.

**The middleware file is named `proxy.ts` on purpose** — Next.js recognizes it as middleware via the config export. Do not rename it.

### API routes vs server actions

This project uses **API routes only** (`src/app/api/**/route.ts`) — no server actions. All writes flow through HTTP endpoints. Follow this pattern when adding features.

A common pattern inside API routes: verify auth with the user-scoped server client via `supabase.auth.getUser()`, then **switch to the service-role client** (`SUPABASE_SERVICE_ROLE_KEY`) for the actual DB write. This avoids RLS edge cases while keeping the auth check server-enforced. Never expose the service-role key client-side.

### TrackingMore integration (`src/lib/trackingmore.ts`)

All calls to TrackingMore go through `/api/track/*` so the API key stays server-side.

**Critical gotcha:** TrackingMore V4's "create" endpoint is actually "create & get" — it returns an error (codes `4016`, `4101`) if the tracking number already exists. The wrapper handles this with a **delete-and-recreate** flow, with a fallback to return minimal cached data if the recreate still fails. If you touch this code, preserve that behavior or refreshing an existing tracking will break.

### Row-Level Security

RLS is enforced on `profiles`, `trackings`, and `contact_submissions`. Policies:

- Users read/write only their own rows (`auth.uid() = user_id`)
- Admins bypass via the `is_admin()` function — a `SECURITY DEFINER` helper that reads `profiles.role` **without** re-triggering RLS on `profiles` (this was the fix in migration 003; the original recursive policy broke every admin query)
- Anonymous reads allowed on `trackings` where `is_public = true` (shareable pages)

When adding new policies that reference `profiles`, **do not** inline a `SELECT role FROM profiles` — call `is_admin()` instead, or you'll reintroduce the recursion bug.

### Realtime (`src/lib/use-realtime-trackings.ts`)

The `trackings` table has Realtime enabled. The hook subscribes to INSERT / UPDATE / DELETE filtered by `user_id`, driving live updates on dashboard and history without polling. If you add a new table that needs the same behavior, enable it in a migration via `alter publication supabase_realtime add table ...` and mirror this hook's pattern.

### Dashboard stats

`/api/dashboard/route.ts` computes summary cards, 30-day volume, courier breakdown, and in-transit list **server-side**. Do not move this computation to the client — raw tracking data should not leave the server boundary for this endpoint.

### CSV bulk import

Parsing is **client-side** (PapaParse) — no file upload to the server. The client then POSTs rows to `/api/import` in batches of 3 to stay under TrackingMore rate limits. Preserve the batching when modifying import flow.

### Email (contact form)

Sending uses the **Resend HTTP API** (not SMTP/nodemailer, even though `nodemailer` is still in `package.json`). The sender address is `onboarding@resend.dev` (Resend's pre-verified domain) — switching to a custom domain requires DNS verification in the Resend dashboard first. Contact submissions are **always persisted to the DB** regardless of email success, so email failure doesn't lose user data.

## Key types

`src/types/index.ts` defines the core domain types. When adding fields, update types first, then the Zod schema in `src/lib/validators.ts`, then the DB migration — in that order keeps the compiler honest.

## Testing

Playwright E2E tests **mock TrackingMore** via `page.route()` intercepts — they do not hit the real API. Use the same pattern for any new tests that involve external calls. Shared fixtures live in `e2e/fixtures.ts` (test user creds, `loginAs()` helper).

## Development process docs

- `PLAN.md` — original 14-phase build plan
- `DEVELOPMENT_LOG.md` — phase-by-phase log with decisions, bugs, and fixes (useful context when picking up a feature area)
- `PARCEL_TRACKER_CHALLENGE.pdf` — the original spec
