import Link from "next/link";
import { Package } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <Package className="h-4 w-4" />
          <span>Parcel Tracker</span>
        </div>
        <div className="flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
          <Link
            href="/track"
            className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Track
          </Link>
          <Link
            href="/contact"
            className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Contact
          </Link>
          <Link
            href="/login"
            className="transition-colors hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            Sign In
          </Link>
        </div>
      </div>
    </footer>
  );
}
