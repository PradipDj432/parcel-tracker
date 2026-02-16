export function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex items-center gap-4">
            <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-3 w-64 rounded bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            <div className="h-3 w-24 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        </div>
      ))}
    </div>
  );
}
