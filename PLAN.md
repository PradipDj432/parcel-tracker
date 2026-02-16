# Parcel Tracker App — Step-by-Step Build Plan

## Phase 0: Pre-Development Setup
1. **External accounts** — set up before writing any code:
   - Create a **Supabase project** (get URL + anon key + service role key)
   - Create a **TrackingMore account** (get API key)
   - Set up an **SMTP provider** (e.g., Resend, SendGrid, or Mailgun) for the contact form
2. **Verify Entire CLI** is syncing sessions to your GitHub repo
3. **Create `.env.local`** with all keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TRACKINGMORE_API_KEY`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_EMAIL`
4. **Add `.env.local` to `.gitignore`** (critical — no secrets in repo)

---

## Phase 1: Project Foundation & Dependencies
5. **Install core dependencies:**
   - `@supabase/supabase-js`, `@supabase/ssr` (auth + DB)
   - `react-hot-toast` or `sonner` (toast notifications)
   - `recharts` or `chart.js` (dashboard charts)
   - `qrcode.react` (QR codes for shareable pages)
   - `@dnd-kit/core`, `@dnd-kit/sortable` (drag-and-drop for tracking fields)
   - `papaparse` (CSV parsing for bulk import)
   - `zod` (schema validation)
   - `playwright` (dev dependency — E2E tests)
6. **Set up project structure:**
   ```
   src/
   ├── app/
   │   ├── (auth)/login/page.tsx
   │   ├── (auth)/signup/page.tsx
   │   ├── (protected)/dashboard/page.tsx
   │   ├── (protected)/history/page.tsx
   │   ├── (protected)/import/page.tsx
   │   ├── (admin)/admin/page.tsx
   │   ├── track/page.tsx              ← public tracking form
   │   ├── track/[id]/page.tsx         ← shareable public tracking page
   │   ├── contact/page.tsx
   │   ├── api/track/route.ts          ← proxy to TrackingMore
   │   ├── api/track/detect/route.ts   ← courier auto-detect
   │   ├── api/contact/route.ts
   │   ├── api/import/route.ts
   │   ├── api/og/[id]/route.ts        ← OG image generation
   │   └── layout.tsx
   ├── components/
   ├── lib/
   │   ├── supabase/client.ts
   │   ├── supabase/server.ts
   │   ├── supabase/middleware.ts
   │   ├── trackingmore.ts
   │   └── validators.ts
   ├── types/
   └── middleware.ts
   ```
7. **Set up Supabase clients** — browser client, server client, and middleware helper
8. **Set up Next.js middleware** for auth session refresh on every request
9. **Create a global theme provider** for dark/light mode toggle (use `next-themes` or manual approach with Tailwind's `dark:` class)
10. **Commit:** `"Project foundation: deps, folder structure, Supabase clients, theme"`

---

## Phase 2: Database Schema (Supabase)
11. **Create tables via Supabase SQL editor or migrations:**
    - **`profiles`** — `id (FK → auth.users)`, `email`, `role (guest|user|admin)`, `created_at`
    - **`trackings`** — `id (uuid)`, `user_id (FK → profiles, nullable for guests)`, `tracking_number`, `courier_code`, `status`, `last_event`, `origin`, `destination`, `checkpoints (jsonb)`, `is_public`, `public_slug (unique)`, `created_at`, `updated_at`
    - **`contact_submissions`** — `id`, `name`, `email`, `message`, `ip_address`, `created_at`
12. **Add indexes:** on `trackings.user_id`, `trackings.tracking_number`, `trackings.public_slug`, `trackings.status`, `contact_submissions.ip_address`
13. **Enable Row-Level Security (RLS) on all tables:**
    - `profiles`: users can read/update only their own row; admins can read all
    - `trackings`: users CRUD only their own; admins read all; anyone can read where `is_public = true`
    - `contact_submissions`: insert only; admins read all
14. **Create a trigger** on `auth.users` insert to auto-create a `profiles` row with default role `user`
15. **Enable Supabase Realtime** on the `trackings` table (needed for live updates)
16. **Commit:** `"Database schema: tables, indexes, RLS policies, realtime"`

---

## Phase 3: Authentication
17. **Build signup page** — email/password form, calls `supabase.auth.signUp()`
18. **Build login page** — email/password form, calls `supabase.auth.signInWithPassword()`
19. **Build auth layout** — redirect authenticated users away from login/signup
20. **Build protected layout** — redirect unauthenticated users to login
21. **Add logout functionality** in a navbar/header component
22. **Create an `AuthProvider` context** that exposes `user`, `profile`, `isAdmin`, `isLoading`
23. **Build the navbar/header** — show different links based on auth state (guest vs user vs admin)
24. **Commit:** `"Authentication: signup, login, logout, protected routes, auth context"`

---

## Phase 4: Core Tracking Feature
25. **Build the TrackingMore API proxy route** (`/api/track/route.ts`):
    - Accepts tracking number + courier code
    - Calls TrackingMore API server-side (secrets never exposed)
    - Returns normalized tracking data
26. **Build the courier detect route** (`/api/track/detect/route.ts`):
    - Calls TrackingMore's carrier detect endpoint
    - Returns list of possible couriers
27. **Build the tracking form page** (`/track`):
    - Input field for tracking number
    - Auto-detect courier on input, show dropdown to confirm/change
    - Support up to 6 tracking fields with add/remove buttons
    - **Drag-and-drop reordering** using `@dnd-kit`
    - "Track" button submits all numbers
28. **Build the tracking results view:**
    - Status timeline component (vertical timeline with checkpoints)
    - Status badge (in transit, delivered, exception, etc.)
    - Show origin, destination, estimated delivery
29. **Guest flow:** allow tracking without login (single parcel only, not saved)
30. **Logged-in flow:** after tracking, save results to `trackings` table in Supabase
31. **Commit:** `"Core tracking: API proxy, courier detect, multi-track form, results timeline"`

---

## Phase 5: History Page
32. **Build history page** (`/history`):
    - Fetch all user's trackings from Supabase
    - Display as a list/table with: tracking number, courier, status, last update date
33. **Add filtering** by status (all, in transit, delivered, exception, etc.)
34. **Add sorting** by date (newest/oldest first)
35. **Add refresh button** per tracking — calls API, updates Supabase row
36. **Add delete** — single delete + multi-select bulk delete with confirmation
37. **Add loading skeletons** and **empty state** (no trackings yet)
38. **Commit:** `"History page: list, filter, sort, refresh, delete, bulk delete"`

---

## Phase 6: Live Updates (Realtime)
39. **Subscribe to Supabase Realtime** on the `trackings` table filtered by `user_id`
40. **When a row is updated** (e.g., from another tab/device), update the UI instantly
41. **Apply to both** the history page and the dashboard
42. **Commit:** `"Live updates: Supabase realtime subscriptions across tabs/devices"`

---

## Phase 7: Dashboard
43. **Build dashboard page** (`/dashboard`)
44. **Summary cards** (server-side computed):
    - Total trackings
    - Currently in transit
    - Delivered this month
    - Average delivery time
45. **Tracking volume chart** — line/bar chart of trackings over the past 30 days using `recharts`
46. **Courier breakdown** — table or chart showing courier usage frequency + delivery success rate
47. **In-transit parcels list** — with a quick-refresh button on each
48. **All stats fetched via server components or API routes** (not client-side computation)
49. **Commit:** `"Dashboard: summary cards, charts, courier breakdown, in-transit list"`

---

## Phase 8: Bulk Import
50. **Build import page** (`/import`)
51. **CSV upload** — drag-and-drop zone or file input, parse with `papaparse`
52. **Validation report** — show table of parsed rows, highlight invalid ones (missing tracking number, bad courier code)
53. **Review & confirm step** — user removes bad rows or fixes them, then clicks "Submit"
54. **Progress UI** — show a progress bar as each tracking is submitted to the API
55. **Summary** — show how many succeeded/failed after completion
56. **Handle large files** — process in batches, don't block the UI
57. **Commit:** `"Bulk import: CSV upload, validation, review, progress, batch processing"`

---

## Phase 9: Shareable Tracking Pages
58. **Generate a unique `public_slug`** for each tracking (e.g., nanoid or short uuid)
59. **Build public tracking page** (`/track/[id]`):
    - Fetch tracking by `public_slug` where `is_public = true`
    - Show full timeline (no login required)
    - Generate and display a **QR code** linking to this page
60. **Build OG image route** (`/api/og/[id]`):
    - Use Next.js `ImageResponse` (from `next/og`) to generate a dynamic social preview image
    - Show tracking number, status, courier logo
61. **Add `<meta>` OG tags** to the shareable page's metadata
62. **Add public/private toggle** on the history page and tracking result — updates `is_public` in Supabase
63. **Commit:** `"Shareable tracking: public pages, QR code, OG image, privacy toggle"`

---

## Phase 10: Contact Form
64. **Build contact page** (`/contact`):
    - Fields: name, email, subject, message
    - Client-side validation + server-side validation with `zod`
65. **Build contact API route** (`/api/contact`):
    - Validate input
    - **Rate limit** by IP (e.g., max 3 submissions per hour — store in `contact_submissions` table and check)
    - Send email via SMTP (use `nodemailer` or the SMTP provider's SDK)
66. **Commit:** `"Contact form: validation, rate limiting, email sending"`

---

## Phase 11: Admin Panel
67. **Build admin page** (`/admin`):
    - Guard with role check (redirect non-admins)
68. **All users list** — show email, role, number of trackings, last active
69. **All tracking activity** — searchable/filterable table of all trackings across users
70. **Usage statistics** — total users, total trackings, API calls, most active users
71. **Commit:** `"Admin panel: user list, tracking activity, usage stats"`

---

## Phase 12: UI Polish
72. **Responsive design** — test and fix layouts for mobile, tablet, desktop
73. **Dark/light mode toggle** — in header, persisted to localStorage
74. **Loading states** — skeleton loaders on every data-fetching page
75. **Animations** — page transitions, list item enter/exit, drag-and-drop feedback (use CSS transitions or `framer-motion`)
76. **Toast notifications** — success/error/info for all user actions (track, delete, import, contact submit, etc.)
77. **Empty states** — friendly illustrations/messages when history is empty, no in-transit parcels, etc.
78. **Commit:** `"UI polish: responsive, dark mode, skeletons, animations, toasts, empty states"`

---

## Phase 13: E2E Testing (Playwright)
79. **Install & configure Playwright** (`npx playwright install`)
80. **Set up test utilities** — mock Supabase auth, mock TrackingMore API responses (tests must be independent of external services)
81. **Write tests:**
    - Auth flow: signup, login, logout, accessing protected route redirects to login
    - Guest tracking: track a single parcel without account
    - Logged-in tracking: track, verify it appears in history
    - Bulk CSV import: upload file with valid + invalid rows, verify validation report
    - Shareable page: toggle public/private, verify public page accessible/inaccessible
82. **Commit:** `"E2E tests: auth, tracking, history, bulk import, shareable pages"`

---

## Phase 14: Final Delivery
83. **Write a proper README** — project overview, tech stack, setup instructions (env vars, Supabase schema, etc.), architecture decisions
84. **Add `.env.example`** with all required keys (no values)
85. **Verify Vercel deployment** — make sure it builds and runs on Vercel
86. **Verify Entire CLI sessions** are visible on the repo
87. **Final commit:** `"README, env example, deployment verification"`

---

## Suggested Commit Order

| # | Commit Theme |
|---|---|
| 1 | Project foundation & deps |
| 2 | Database schema & RLS |
| 3 | Authentication |
| 4 | Core tracking |
| 5 | History page |
| 6 | Live updates |
| 7 | Dashboard |
| 8 | Bulk import |
| 9 | Shareable pages |
| 10 | Contact form |
| 11 | Admin panel |
| 12 | UI polish |
| 13 | E2E tests |
| 14 | Final README & cleanup |
