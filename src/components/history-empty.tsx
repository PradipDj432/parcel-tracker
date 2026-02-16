import Link from "next/link";

export function HistoryEmpty() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 py-16 dark:border-zinc-700">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-400 dark:text-zinc-600"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
      <h3 className="mt-4 text-sm font-medium text-zinc-900 dark:text-white">
        No trackings yet
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Track a parcel to see it appear in your history.
      </p>
      <Link
        href="/track"
        className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Track a parcel
      </Link>
    </div>
  );
}
