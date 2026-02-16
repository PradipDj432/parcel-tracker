import Link from "next/link";
import {
  Package,
  Search,
  BarChart3,
  Upload,
  Globe,
  Shield,
  Zap,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Search,
    title: "Multi-Parcel Tracking",
    description:
      "Track up to 6 parcels simultaneously with auto courier detection and drag-and-drop reordering.",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    description:
      "Get instant status updates via live subscriptions — changes sync across all your devices.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description:
      "Visualize your shipping data with charts, courier breakdowns, and delivery stats.",
  },
  {
    icon: Upload,
    title: "Bulk CSV Import",
    description:
      "Import hundreds of tracking numbers at once with validation, review, and batch processing.",
  },
  {
    icon: Globe,
    title: "Shareable Pages",
    description:
      "Generate public tracking pages with QR codes and social preview images for easy sharing.",
  },
  {
    icon: Shield,
    title: "Secure & Private",
    description:
      "Row-level security, server-side API proxying, and granular privacy controls for every parcel.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(120,119,198,0.12),transparent)] dark:bg-[radial-gradient(45%_40%_at_50%_60%,rgba(120,119,198,0.08),transparent)]" />
        <div className="mx-auto max-w-5xl px-4 pb-20 pt-24 text-center sm:pt-32">
          <div className="animate-fade-in">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 dark:bg-white">
              <Package className="h-8 w-8 text-white dark:text-zinc-900" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Track every parcel,
              <br />
              <span className="bg-gradient-to-r from-zinc-600 via-zinc-900 to-zinc-600 bg-clip-text text-transparent dark:from-zinc-400 dark:via-white dark:to-zinc-400">
                all in one place
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
              A modern parcel tracking app with real-time updates, analytics
              dashboard, bulk import, and shareable tracking pages.
            </p>
          </div>

          <div className="mt-8 flex animate-slide-up flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/track"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-zinc-900/20 transition-all hover:bg-zinc-800 hover:shadow-xl dark:bg-white dark:text-zinc-900 dark:shadow-white/10 dark:hover:bg-zinc-100"
            >
              <Search className="h-4 w-4" />
              Start Tracking
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium transition-all hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
            >
              Create Account
              <Zap className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50">
        <div className="mx-auto max-w-5xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Everything you need
            </h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Powerful features for tracking, analyzing, and sharing your
              shipments.
            </p>
          </div>

          <div className="stagger-children grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 transition-colors group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700">
                  <f.icon className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Ready to track your parcels?
          </h2>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            No account required for basic tracking. Sign up to unlock all
            features.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/track"
              className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
            >
              Track Now
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
