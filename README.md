# Parcel Tracker

A full-featured parcel tracking web application built with Next.js 16, React 19, and Supabase. Track parcels across multiple carriers, view delivery history, share tracking pages publicly, and manage everything from an admin dashboard.

## Features

- **Multi-Parcel Tracking** — Track up to 6 parcels simultaneously with drag-and-drop reordering
- **Carrier Auto-Detection** — Automatically identifies the carrier from a tracking number via TrackingMore API
- **Tracking History** — Filter, sort, refresh, and bulk-delete past trackings
- **Live Updates** — Real-time status changes via Supabase Realtime subscriptions
- **Dashboard** — Server-side computed stats, tracking volume charts, and courier breakdowns
- **Bulk CSV Import** — Upload a CSV of tracking numbers with validation, review, and progress tracking
- **Shareable Pages** — Public tracking pages with QR codes and Open Graph images for social sharing
- **Contact Form** — Rate-limited contact form with server-side validation and email delivery via Resend
- **Admin Panel** — View all users, tracking activity, and usage statistics
- **Dark/Light Mode** — Theme toggle persisted to localStorage
- **Responsive Design** — Mobile, tablet, and desktop layouts
- **E2E Tests** — Playwright tests covering auth, tracking, import, admin, and navigation flows

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev), [Tailwind CSS 4](https://tailwindcss.com) |
| Auth & Database | [Supabase](https://supabase.com) (Auth + PostgreSQL + Realtime) |
| Tracking API | [TrackingMore](https://www.trackingmore.com) |
| Charts | [Recharts](https://recharts.org) |
| Drag & Drop | [@dnd-kit](https://dndkit.com) |
| CSV Parsing | [PapaParse](https://www.papaparse.com) |
| QR Codes | [qrcode.react](https://github.com/zpao/qrcode.react) |
| Validation | [Zod](https://zod.dev) |
| Email | [Resend](https://resend.com) |
| Testing | [Playwright](https://playwright.dev) |

## Access Levels

| Role | Capabilities |
|------|-------------|
| **Guest** | Track a single parcel (not saved) |
| **Registered User** | Track up to 6 parcels, history, dashboard, import, shareable pages |
| **Admin** | Everything above + admin panel with all users' data and usage stats |

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- A [TrackingMore](https://www.trackingmore.com) API key
- (Optional) SMTP credentials for the contact form email delivery

### 1. Clone and Install

```bash
git clone https://github.com/PradipDj432/parcel-tracker.git
cd parcel-tracker
npm install
```

### 2. Configure Environment Variables

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env.local
```

See [`.env.example`](.env.example) for all required variables.

### 3. Set Up the Database

Run the SQL migrations in your Supabase SQL Editor in order:

1. **`supabase/migrations/001_initial_schema.sql`** — Creates tables (`profiles`, `trackings`, `contact_submissions`), indexes, RLS policies, triggers, and enables Realtime
2. **`supabase/migrations/002_contact_subject.sql`** — Adds `subject` column to contact submissions
3. **`supabase/migrations/003_fix_rls_recursion.sql`** — Fixes infinite recursion in admin RLS policies using a `SECURITY DEFINER` helper function

These migrations set up:
- **Row-Level Security (RLS)** on all tables — users can only access their own data, admins can read everything
- **Auto-profile creation** trigger on signup
- **Auto-updated `updated_at`** trigger on trackings
- **Realtime** enabled on the `trackings` table

### 4. Create an Admin User

After signing up through the app, promote a user to admin by running this in the Supabase SQL Editor:

```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/          # Login page
│   ├── (auth)/signup/         # Signup page
│   ├── (protected)/dashboard/ # Dashboard with stats & charts
│   ├── (protected)/history/   # Tracking history with filter/sort
│   ├── (protected)/import/    # Bulk CSV import wizard
│   ├── (admin)/admin/         # Admin panel
│   ├── track/                 # Public tracking form
│   ├── track/[id]/            # Shareable public tracking page
│   ├── contact/               # Contact form
│   ├── api/track/             # TrackingMore API proxy
│   ├── api/contact/           # Contact form submission
│   ├── api/import/            # Bulk import endpoint
│   ├── api/dashboard/         # Dashboard stats API
│   ├── api/admin/             # Admin data APIs
│   └── api/og/[id]/           # Dynamic OG image generation
├── components/                # Reusable UI components
│   ├── charts/                # Recharts chart components
│   ├── navbar.tsx             # Navigation bar
│   ├── tracking-form.tsx      # Multi-parcel tracking form
│   ├── tracking-timeline.tsx  # Status timeline display
│   ├── import-wizard.tsx      # CSV import flow
│   └── ...
├── lib/
│   ├── supabase/client.ts     # Browser Supabase client
│   ├── supabase/server.ts     # Server-side Supabase client
│   ├── supabase/middleware.ts  # Auth session refresh helper
│   ├── trackingmore.ts        # TrackingMore API wrapper
│   ├── validators.ts          # Zod validation schemas
│   └── use-realtime-trackings.ts  # Realtime subscription hook
└── types/                     # TypeScript type definitions

e2e/                           # Playwright E2E tests
supabase/migrations/           # SQL migration files
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run Playwright tests with UI |

## Architecture Decisions

- **API Proxy for TrackingMore** — All TrackingMore API calls go through Next.js API routes (`/api/track/`) so the API key is never exposed to the client
- **Supabase RLS** — Row-Level Security enforces data isolation at the database level; users can only query their own rows
- **Server Components for Stats** — Dashboard statistics are computed server-side to avoid sending raw data to the client
- **Realtime Subscriptions** — The `trackings` table uses Supabase Realtime so updates from one tab/device propagate instantly to others
- **Rate Limiting** — Contact form submissions are rate-limited by IP address (checked against recent entries in `contact_submissions`)
- **Public Slug System** — Each tracking gets a unique `public_slug` (via nanoid) that can be toggled public/private for sharing

## Deployment

### Vercel (Recommended)

1. Push your repo to GitHub
2. Import the project on [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example` to the Vercel project settings
4. Deploy — Vercel auto-detects Next.js and handles the build

### Environment Variables for Production

Make sure to set all variables from `.env.example` in your hosting provider's environment configuration. The `NEXT_PUBLIC_*` variables are embedded at build time.

## License

This project was built as part of a technical interview challenge.
