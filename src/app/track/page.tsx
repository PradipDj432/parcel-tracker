"use client";

import { useState } from "react";
import { TrackingForm } from "@/components/tracking-form";
import { TrackingResultCard } from "@/components/tracking-result-card";
import type { TrackingResult } from "@/types";

export default function TrackPage() {
  const [results, setResults] = useState<TrackingResult[]>([]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Track a Parcel</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter your tracking number to get real-time updates.
        </p>
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
