"use client";

import { useState } from "react";
import type { TrackingResult } from "@/types";
import { StatusBadge } from "@/components/status-badge";
import { TrackingTimeline } from "@/components/tracking-timeline";
import { ChevronDown, MapPin, Navigation, CalendarClock, Truck } from "lucide-react";

export function TrackingResultCard({ result }: { result: TrackingResult }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="animate-scale-in rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-mono text-sm font-medium">
              {result.tracking_number}
            </span>
            <StatusBadge status={result.status} />
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {result.courier_name || result.courier_code}
            {result.last_event && ` — ${result.last_event}`}
          </p>
        </div>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Body */}
      {expanded && (
        <div className="border-t border-zinc-100 px-4 py-4 dark:border-zinc-800">
          {/* Meta info */}
          <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            {result.origin && (
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Origin
                  </p>
                  <p className="font-medium">{result.origin}</p>
                </div>
              </div>
            )}
            {result.destination && (
              <div className="flex items-start gap-2">
                <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Destination
                  </p>
                  <p className="font-medium">{result.destination}</p>
                </div>
              </div>
            )}
            {result.estimated_delivery && (
              <div className="flex items-start gap-2">
                <CalendarClock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                <div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Est. Delivery
                  </p>
                  <p className="font-medium">{result.estimated_delivery}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Courier
                </p>
                <p className="font-medium">
                  {result.courier_name || result.courier_code}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <TrackingTimeline checkpoints={result.checkpoints} />
        </div>
      )}
    </div>
  );
}
