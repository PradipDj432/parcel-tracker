"use client";

import { useState } from "react";
import { TrackingForm } from "@/components/tracking-form";
import { TrackingResultCard } from "@/components/tracking-result-card";
import { Search } from "lucide-react";
import type { TrackingResult } from "@/types";

export default function TrackPage() {
  const [results, setResults] = useState<TrackingResult[]>([]);

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
          <h2 className="text-lg font-semibold">Results</h2>
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
