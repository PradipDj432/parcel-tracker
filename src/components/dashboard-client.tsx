"use client";

import { useState, useCallback, useMemo } from "react";
import { useRealtimeTrackings } from "@/lib/use-realtime-trackings";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import Link from "next/link";
import type { Parcel, TrackingStatus } from "@/types";

interface DashboardClientProps {
  initialTrackings: Parcel[];
}

export function DashboardClient({ initialTrackings }: DashboardClientProps) {
  const [trackings, setTrackings] = useState<Parcel[]>(initialTrackings);
  const { user } = useAuth();

  // Realtime — keeps dashboard in sync across tabs/devices
  useRealtimeTrackings({
    userId: user?.id,
    onInsert: useCallback((parcel: Parcel) => {
      setTrackings((prev) => {
        if (prev.some((t) => t.id === parcel.id)) return prev;
        return [parcel, ...prev];
      });
    }, []),
    onUpdate: useCallback((parcel: Parcel) => {
      setTrackings((prev) =>
        prev.map((t) => (t.id === parcel.id ? parcel : t))
      );
    }, []),
    onDelete: useCallback((id: string) => {
      setTrackings((prev) => prev.filter((t) => t.id !== id));
    }, []),
  });

  // Compute stats
  const stats = useMemo(() => {
    const total = trackings.length;
    const delivered = trackings.filter((t) => t.status === "delivered").length;
    const inTransit = trackings.filter((t) => t.status === "transit").length;
    const exception = trackings.filter(
      (t) => t.status === "exception" || t.status === "undelivered"
    ).length;
    const pending = trackings.filter(
      (t) => t.status === "pending" || t.status === "inforeceived"
    ).length;

    const courierCounts: Record<string, number> = {};
    for (const t of trackings) {
      courierCounts[t.courier_code] = (courierCounts[t.courier_code] || 0) + 1;
    }

    return { total, delivered, inTransit, exception, pending, courierCounts };
  }, [trackings]);

  // Recent trackings (latest 5)
  const recent = trackings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Parcels" value={stats.total} />
        <StatCard label="In Transit" value={stats.inTransit} color="amber" />
        <StatCard label="Delivered" value={stats.delivered} color="green" />
        <StatCard label="Exceptions" value={stats.exception} color="red" />
      </div>

      {/* Recent trackings */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Trackings</h2>
          <Link
            href="/history"
            className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            View all
          </Link>
        </div>

        {recent.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No trackings yet.{" "}
              <Link
                href="/track"
                className="font-medium text-zinc-900 hover:underline dark:text-white"
              >
                Track a parcel
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((tracking) => (
              <div
                key={tracking.id}
                className="flex items-center gap-4 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm font-medium">
                    {tracking.tracking_number}
                  </p>
                  {tracking.last_event && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {tracking.last_event}
                    </p>
                  )}
                </div>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {tracking.courier_code}
                </span>
                <StatusBadge status={tracking.status as TrackingStatus} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Courier breakdown */}
      {Object.keys(stats.courierCounts).length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">By Courier</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {Object.entries(stats.courierCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([courier, count]) => (
                <div
                  key={courier}
                  className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {courier}
                  </p>
                  <p className="text-lg font-semibold">{count}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "amber" | "green" | "red";
}) {
  const colorClasses = {
    amber: "text-amber-600 dark:text-amber-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
  };

  return (
    <div className="rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${color ? colorClasses[color] : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
