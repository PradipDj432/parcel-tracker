import type { TrackingStatus } from "@/types";

const statusConfig: Record<
  TrackingStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
  inforeceived: {
    label: "Info Received",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  pickup: {
    label: "Picked Up",
    className:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  },
  transit: {
    label: "In Transit",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  delivered: {
    label: "Delivered",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  },
  undelivered: {
    label: "Undelivered",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  exception: {
    label: "Exception",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  expired: {
    label: "Expired",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
  notfound: {
    label: "Not Found",
    className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

export function StatusBadge({ status }: { status: TrackingStatus }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
