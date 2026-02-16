"use client";

import { useState, useCallback, useEffect } from "react";
import { useRealtimeTrackings } from "@/lib/use-realtime-trackings";
import { useAuth } from "@/components/auth-provider";
import { StatusBadge } from "@/components/status-badge";
import { VolumeChart } from "@/components/charts/volume-chart";
import { CourierChart } from "@/components/charts/courier-chart";
import Link from "next/link";
import { toast } from "sonner";
import { RefreshCw, ArrowRight, Package, TrendingUp, CheckCircle2, Clock } from "lucide-react";
import type { Parcel, TrackingStatus } from "@/types";

interface DashboardStats {
  summary: {
    total: number;
    inTransit: number;
    deliveredThisMonth: number;
    avgDeliveryDays: number;
  };
  dailyVolume: { date: string; count: number }[];
  courierBreakdown: {
    courier: string;
    total: number;
    delivered: number;
    successRate: number;
  }[];
  inTransitParcels: Parcel[];
}

interface DashboardClientProps {
  initialTrackings: Parcel[];
}

export function DashboardClient({ initialTrackings }: DashboardClientProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [, setTrackings] = useState<Parcel[]>(initialTrackings);

  // Fetch server-side computed stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Realtime — refetch stats when data changes
  useRealtimeTrackings({
    userId: user?.id,
    onInsert: useCallback(
      (parcel: Parcel) => {
        setTrackings((prev) => {
          if (prev.some((t) => t.id === parcel.id)) return prev;
          return [parcel, ...prev];
        });
        fetchStats();
      },
      [fetchStats]
    ),
    onUpdate: useCallback(
      (parcel: Parcel) => {
        setTrackings((prev) =>
          prev.map((t) => (t.id === parcel.id ? parcel : t))
        );
        fetchStats();
      },
      [fetchStats]
    ),
    onDelete: useCallback(
      (id: string) => {
        setTrackings((prev) => prev.filter((t) => t.id !== id));
        fetchStats();
      },
      [fetchStats]
    ),
  });

  // Refresh a single in-transit tracking
  const refreshTracking = async (tracking: Parcel) => {
    setRefreshingIds((prev) => new Set(prev).add(tracking.id));
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackingNumber: tracking.tracking_number,
          courierCode: tracking.courier_code,
        }),
      });
      const json = await res.json();
      if (json.data) {
        toast.success(`Updated ${tracking.tracking_number}`);
        fetchStats(); // Refetch all stats
      } else {
        toast.error(json.error || "Failed to refresh");
      }
    } catch {
      toast.error("Failed to refresh tracking");
    } finally {
      setRefreshingIds((prev) => {
        const next = new Set(prev);
        next.delete(tracking.id);
        return next;
      });
    }
  };

  if (!stats) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Trackings" value={String(stats.summary.total)} />
        <StatCard
          label="In Transit"
          value={String(stats.summary.inTransit)}
          color="amber"
        />
        <StatCard
          label="Delivered This Month"
          value={String(stats.summary.deliveredThisMonth)}
          color="green"
        />
        <StatCard
          label="Avg Delivery Time"
          value={
            stats.summary.avgDeliveryDays > 0
              ? `${stats.summary.avgDeliveryDays}d`
              : "—"
          }
          color="blue"
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <VolumeChart data={stats.dailyVolume} />
        <CourierChart data={stats.courierBreakdown} />
      </div>

      {/* In-transit parcels */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">In-Transit Parcels</h2>
          <Link
            href="/history"
            className="flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            View all history
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {stats.inTransitParcels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 py-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No parcels currently in transit.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {stats.inTransitParcels.map((tracking) => (
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
                <span className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
                  {tracking.courier_code}
                </span>
                <StatusBadge status={tracking.status as TrackingStatus} />
                <button
                  onClick={() => refreshTracking(tracking)}
                  disabled={refreshingIds.has(tracking.id)}
                  className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  title="Refresh"
                >
                  <RefreshCw
                    className={`h-3.5 w-3.5 ${
                      refreshingIds.has(tracking.id) ? "animate-spin" : ""
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: "amber" | "green" | "red" | "blue";
}) {
  const colorClasses = {
    amber: "text-amber-600 dark:text-amber-400",
    green: "text-green-600 dark:text-green-400",
    red: "text-red-600 dark:text-red-400",
    blue: "text-blue-600 dark:text-blue-400",
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

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div className="h-3 w-20 rounded bg-zinc-200 dark:bg-zinc-700" />
            <div className="mt-2 h-7 w-12 rounded bg-zinc-200 dark:bg-zinc-700" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
        <div className="h-72 animate-pulse rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
      </div>
    </div>
  );
}
