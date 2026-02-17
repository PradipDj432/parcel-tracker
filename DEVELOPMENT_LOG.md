# Development Log — Parcel Tracker

This document records the development process of the Parcel Tracker app, built entirely using **Claude Code** (Anthropic's agentic AI coding assistant). It covers each phase, the decisions made, challenges encountered, and how user questions shaped the final product.

---

## Development Approach

The project was built incrementally across 14 phases, each committed separately to reflect real development progression. Claude Code handled architecture decisions, code generation, debugging, and deployment guidance — while the user tested features, provided feedback, and ran database migrations.

---

## Phase 0 — Setup & Planning

**What was done:** Initialized the GitHub repo, installed Entire CLI for session recording, set up the Next.js 16 project with TypeScript and Tailwind CSS 4, created a Supabase project, and drafted a detailed build plan (`PLAN.md`).

**Key decision:** Chose Next.js App Router over Pages Router for server components, layouts, and API routes in one unified structure.

---

## Phase 1 — Foundation

**What was done:** Scaffolded the full project structure — layouts, theme provider (next-themes), Sonner toast notifications, and base UI components.

**Key decision:** Used `next-themes` for dark/light mode with localStorage persistence, and Sonner for toast notifications throughout the app.

---

## Phase 2 — Database Schema

**What was done:** Created the full Supabase schema — `profiles`, `trackings`, and `contact_submissions` tables with foreign keys, indexes, RLS policies, auto-profile trigger, and Realtime enabled on `trackings`.

**Key decision:** Used `nanoid` to generate unique `public_slug` values for shareable tracking pages, stored directly on each tracking row.

---

## Phase 3 — Authentication

**What was done:** Built signup, login, and logout pages. Created an `AuthProvider` context for client-side auth state. Added middleware (`proxy.ts`) to protect routes and redirect unauthenticated users.

> **User question:** "There is already one proxy function that does same things which middleware done."
> **Answer:** Kept the existing `proxy.ts` as the middleware — no rename needed since Next.js recognizes it as middleware in the build output.

---

## Phase 4 — Tracking

**What was done:** Built the core tracking flow — TrackingMore API proxy (`/api/track`), courier auto-detection (`/api/track/detect`), multi-parcel tracking form with drag-and-drop (dnd-kit), and status timeline with delivery checkpoints.

**Key decision:** All TrackingMore API calls go through server-side API routes so the API key is never exposed to the client.

> **User question:** "When I refresh existing tracking or track the same number again, I get 'Tracking No. already exists' error."
> **Answer:** TrackingMore V4's create endpoint is actually "create & get" — it returns an error if the tracking already exists (codes 4016 and 4101). Fixed by implementing a delete-and-recreate approach with a fallback to return minimal cached data if the re-create still fails.

---

## Phase 5 — History

**What was done:** Built the history page with all past trackings displayed. Added filter by status, sort by date (newest/oldest), single and bulk delete with confirmation modals, and refresh to pull latest data from TrackingMore.

---

## Phase 6 — Live Updates (Realtime)

**What was done:** Created a `useRealtimeTrackings` hook that subscribes to Supabase Realtime INSERT, UPDATE, and DELETE events on the `trackings` table, filtered by `user_id`. Connected it to both the history page and dashboard.

**Verification:** Tested by opening two browser tabs — refreshing a tracking in one tab instantly updated the other without a page reload.

---

## Phase 7 — Dashboard

**What was done:** Built the dashboard with 4 summary cards (total trackings, in transit, delivered this month, average delivery time), a 30-day tracking volume line chart (Recharts), courier breakdown bar chart with delivery success rates, and an in-transit parcels list with quick-refresh buttons.

**Key decision:** All statistics are computed server-side in `/api/dashboard/route.ts` — no raw data is sent to the client.

---

## Phase 8 — Bulk Import

**What was done:** Built a CSV import wizard with drag-and-drop file upload, PapaParse parsing, validation report (valid/invalid counts), editable review table, batch submission with progress bar, and a final summary showing success/failure per tracking.

**Key decision:** Batched submissions (3 at a time) to avoid TrackingMore rate limits. Large files are handled client-side by PapaParse with no server upload needed.

---

## Phase 9 — Shareable Tracking Pages

**What was done:** Each tracking gets a unique public URL (`/track/[slug]`) showing the full timeline without login. Added QR code generation (qrcode.react), dynamic OG image generation (`/api/og/[id]`) for social media previews, and a public/private toggle in the history page.

---

## Phase 10 — Contact Form

**What was done:** Built a contact page with name, email, subject, and message fields. Server-side Zod validation, rate limiting (3 submissions per IP per hour), and email delivery.

> **User question:** "I want to send mail to configured email address at time of the contact email send — can you guide me?"
> **Answer:** Set up Resend as the email provider. Initially tried SMTP/nodemailer but the domain wasn't verified. Switched to the Resend HTTP API with `onboarding@resend.dev` as the sender address (Resend's pre-verified domain). Contact form submissions are also saved to the database regardless of email success.

> **User question:** "I did not receive mail, can you test and see backend logs?"
> **Answer:** Tested with curl directly to Resend API — confirmed the API key and endpoint were working. The issue was the unverified custom domain. Using `onboarding@resend.dev` resolved it.

---

## Phase 11 — Admin Panel

**What was done:** Built the admin panel with 4 tabs: Overview (stats + charts), Users (searchable/filterable table), Trackings (all users' trackings), and Messages (contact submissions with expandable details). Protected by admin role check.

---

## Phase 12 — UI Polish

**What was done:** Added responsive breakpoints across all pages, loading skeletons (history, dashboard, admin), CSS animations (fade-in, slide-up, slide-down, scale-in with stagger delays), empty states with icons and CTAs, and consistent toast notifications for all user actions.

---

## Phase 13 — E2E Tests (Playwright)

**What was done:** Wrote Playwright tests covering: auth flow (login, signup, logout, protected routes), guest and logged-in tracking, history page verification, bulk CSV import with valid/invalid data, shareable page public/private toggle, contact form validation and submission, navigation and dark mode toggle, and admin panel access.

**Key decision:** All tests mock external API routes (TrackingMore) via Playwright's `page.route()` to run independently of external services.

> **User question:** "Last time we are getting errors in the test cases, can go and check if errors then fix it?"
> **Answer:** Fixed 11 failing tests — issues included missing system libraries (installed libnspr4, libnss3, etc.), strict mode selector violations, timing issues, and stale selectors. Updated all test files to be more resilient.

---

## Phase 14 — Final Delivery

**What was done:** Cleaned up the repo (removed Windows Zone.Identifier artifacts, test-results directory), updated README with complete setup instructions, updated `.env.example`, and deployed to Vercel.

---

## Challenges & Fixes

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Save, history, and profile not working | Infinite recursion in admin RLS policies on `profiles` table | Created `is_admin()` SECURITY DEFINER function that bypasses RLS |
| "Tracking No. already exists" error | TrackingMore V4 create endpoint returns error for existing numbers | Delete + recreate approach with fallback to cached data |
| Contact emails not sending | Custom Resend domain not verified | Switched to Resend HTTP API with `onboarding@resend.dev` |
| Navbar shows guest state after login | Auth state not refreshing after login/logout | Added server-side signout endpoint + `router.refresh()` before navigation |
| Playwright tests crashing | Missing system libraries for Chromium | Installed required native dependencies (libnspr4, libnss3, etc.) |
| 11 E2E tests failing | Stale selectors, timing issues, strict mode violations | Updated test selectors, added proper waits, scoped locators |

---

## User Interaction Summary

Throughout the build, the user:
- Tested each feature after implementation and reported what worked / what didn't
- Ran database migrations manually in the Supabase SQL Editor
- Configured Resend account and provided API credentials
- Managed the Supabase project settings and environment variables
- Deployed the final app to Vercel via the dashboard
- Provided feedback that drove bug fixes (RLS recursion, auth flow, TrackingMore errors)

Claude Code (agentic AI):
- Designed the architecture and build plan
- Generated all application code across 50+ files
- Debugged issues using error logs, API testing, and codebase analysis
- Wrote and fixed all E2E tests
- Created database migrations and security policies
- Handled all git operations (commits reflecting development progression)

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS 4 |
| Auth & Database | Supabase (Auth + PostgreSQL + Realtime + RLS) |
| Tracking API | TrackingMore (proxied via API routes) |
| Charts | Recharts |
| Drag & Drop | @dnd-kit |
| CSV Parsing | PapaParse |
| QR Codes | qrcode.react |
| Validation | Zod |
| Email | Resend (HTTP API) |
| Testing | Playwright |
| Deployment | Vercel |

---

*Built with Claude Code — Anthropic's agentic AI coding assistant.*
