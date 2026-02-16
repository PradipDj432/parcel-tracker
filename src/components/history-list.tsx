"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge } from "@/components/status-badge";
import { HistoryEmpty } from "@/components/history-empty";
import { useRealtimeTrackings } from "@/lib/use-realtime-trackings";
import { useAuth } from "@/components/auth-provider";
import type { Parcel, TrackingStatus } from "@/types";
import { toast } from "sonner";
import { Share2, Lock, RefreshCw, Trash2 } from "lucide-react";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All" },
  { value: "transit", label: "In Transit" },
  { value: "delivered", label: "Delivered" },
  { value: "pending", label: "Pending" },
  { value: "pickup", label: "Picked Up" },
  { value: "exception", label: "Exception" },
  { value: "expired", label: "Expired" },
  { value: "notfound", label: "Not Found" },
];

type SortOrder = "newest" | "oldest";

interface HistoryListProps {
  initialTrackings: Parcel[];
}

export function HistoryList({ initialTrackings }: HistoryListProps) {
  const [trackings, setTrackings] = useState<Parcel[]>(initialTrackings);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const supabase = createClient();
  const { user } = useAuth();

  // Realtime subscriptions — live updates across tabs/devices
  useRealtimeTrackings({
    userId: user?.id,
    onInsert: useCallback((parcel: Parcel) => {
      setTrackings((prev) => {
        if (prev.some((t) => t.id === parcel.id)) return prev;
        return [parcel, ...prev];
      });
      toast.info(`New tracking added: ${parcel.tracking_number}`);
    }, []),
    onUpdate: useCallback((parcel: Parcel) => {
      setTrackings((prev) =>
        prev.map((t) => (t.id === parcel.id ? parcel : t))
      );
    }, []),
    onDelete: useCallback((id: string) => {
      setTrackings((prev) => prev.filter((t) => t.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, []),
  });

  // Filter
  const filtered = trackings.filter(
    (t) => statusFilter === "all" || t.status === statusFilter
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  // Selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === sorted.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(sorted.map((t) => t.id)));
    }
  };

  // Refresh a single tracking
  const refreshTracking = useCallback(
    async (tracking: Parcel) => {
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
          // Update local state
          setTrackings((prev) =>
            prev.map((t) =>
              t.id === tracking.id
                ? {
                    ...t,
                    status: json.data.status,
                    last_event: json.data.last_event || t.last_event,
                    checkpoints: json.data.checkpoints || t.checkpoints,
                    updated_at: new Date().toISOString(),
                  }
                : t
            )
          );
          toast.success(`Updated ${tracking.tracking_number}`);
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
    },
    []
  );

  // Toggle public/private
  const togglePublic = async (tracking: Parcel) => {
    const newValue = !tracking.is_public;
    const { error } = await supabase
      .from("trackings")
      .update({ is_public: newValue })
      .eq("id", tracking.id);
    if (error) {
      toast.error("Failed to update visibility");
      return;
    }
    setTrackings((prev) =>
      prev.map((t) =>
        t.id === tracking.id ? { ...t, is_public: newValue } : t
      )
    );
    if (newValue && tracking.public_slug) {
      const url = `${window.location.origin}/track/${tracking.public_slug}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! Tracking is now public.");
    } else {
      toast.success("Tracking is now private.");
    }
  };

  // Delete single
  const deleteTracking = async (id: string) => {
    const { error } = await supabase.from("trackings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setTrackings((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success("Tracking deleted");
  };

  // Bulk delete
  const bulkDelete = async () => {
    const ids = Array.from(selected);
    const { error } = await supabase
      .from("trackings")
      .delete()
      .in("id", ids);
    if (error) {
      toast.error("Failed to delete trackings");
      return;
    }
    setTrackings((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    setShowDeleteConfirm(false);
    toast.success(`${ids.length} tracking(s) deleted`);
  };

  if (!trackings.length) {
    return <HistoryEmpty />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-zinc-500">
              {selected.size} selected
            </span>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
            >
              Delete selected
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold">Confirm Delete</h3>
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
              Are you sure you want to delete {selected.size} tracking(s)? This
              action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={bulkDelete}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table header */}
      <div className="hidden items-center gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-medium uppercase text-zinc-500 sm:flex dark:border-zinc-800">
        <input
          type="checkbox"
          checked={selected.size === sorted.length && sorted.length > 0}
          onChange={toggleSelectAll}
          className="h-4 w-4 rounded border-zinc-300"
        />
        <span className="flex-1">Tracking Number</span>
        <span className="w-28">Courier</span>
        <span className="w-24">Status</span>
        <span className="w-32">Last Updated</span>
        <span className="w-24">Actions</span>
      </div>

      {/* Tracking rows */}
      <div className="space-y-2">
        {sorted.map((tracking) => (
          <div
            key={tracking.id}
            className="flex flex-col gap-3 rounded-lg border border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 dark:border-zinc-800"
          >
            {/* Checkbox */}
            <input
              type="checkbox"
              checked={selected.has(tracking.id)}
              onChange={() => toggleSelect(tracking.id)}
              className="h-4 w-4 shrink-0 rounded border-zinc-300"
            />

            {/* Tracking number + last event */}
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

            {/* Courier */}
            <span className="w-28 text-sm text-zinc-600 dark:text-zinc-400">
              {tracking.courier_code}
            </span>

            {/* Status */}
            <div className="w-24">
              <StatusBadge status={tracking.status as TrackingStatus} />
            </div>

            {/* Date */}
            <span className="w-32 text-xs text-zinc-500 dark:text-zinc-400">
              {new Date(tracking.updated_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* Actions */}
            <div className="flex w-24 items-center gap-1">
              <button
                onClick={() => togglePublic(tracking)}
                className={`rounded p-1.5 transition-colors ${
                  tracking.is_public
                    ? "text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                }`}
                title={tracking.is_public ? "Make private" : "Share publicly"}
              >
                {tracking.is_public ? (
                  <Share2 className="h-3.5 w-3.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5" />
                )}
              </button>
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
              <button
                onClick={() => deleteTracking(tracking.id)}
                className="rounded p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && trackings.length > 0 && (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No trackings match the selected filter.
        </p>
      )}
    </div>
  );
}
