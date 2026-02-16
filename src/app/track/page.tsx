"use client";

import { useState } from "react";
import Link from "next/link";
import { TrackingForm } from "@/components/tracking-form";
import { TrackingResultCard } from "@/components/tracking-result-card";
import { Search, History } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import type { TrackingResult } from "@/types";

export default function TrackPage() {
  const [results, setResults] = useState<TrackingResult[]>([]);
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
            <Search className="h-5 w-5 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Track a Parcel
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Enter your tracking number to get real-time updates.
            </p>
          </div>
        </div>
      </div>

      <TrackingForm onResults={setResults} />

      {results.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Results</h2>
            {user && (
              <Link
                href="/history"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                <History className="h-4 w-4" />
                View History
              </Link>
            )}
          </div>
          {user && (
            <p className="text-xs text-green-600 dark:text-green-400">
              Tracking results are automatically saved to your history.
            </p>
          )}
          {results.map((result) => (
            <TrackingResultCard
              key={result.tracking_number}
              result={result}
            />
          ))}
        </div>
      )}
    </div>
  );
}
