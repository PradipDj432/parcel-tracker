import type { TrackingCheckpoint } from "@/types";
import { Clock, MapPin } from "lucide-react";

export function TrackingTimeline({
  checkpoints,
}: {
  checkpoints: TrackingCheckpoint[];
}) {
  if (!checkpoints.length) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-zinc-200 py-8 dark:border-zinc-700">
        <Clock className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          No tracking events available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="relative ml-3 border-l border-zinc-200 dark:border-zinc-700">
      {checkpoints.map((cp, i) => (
        <div key={`${cp.date}-${i}`} className="relative mb-6 ml-6 last:mb-0">
          {/* Dot */}
          <div
            className={`absolute -left-[33px] top-1 h-3 w-3 rounded-full border-2 ${
              i === 0
                ? "border-zinc-900 bg-zinc-900 dark:border-white dark:bg-white"
                : "border-zinc-300 bg-white dark:border-zinc-600 dark:bg-zinc-900"
            }`}
          />

          {/* Content */}
          <div>
            <p
              className={`text-sm font-medium ${
                i === 0
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {cp.description}
            </p>
            <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-500">
              {cp.date && (
                <time className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(cp.date).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
              {cp.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {cp.location}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
