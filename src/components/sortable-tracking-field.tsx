"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X, Loader2 } from "lucide-react";
import type { TrackingField } from "@/types";

interface Props {
  field: TrackingField;
  index: number;
  canRemove: boolean;
  canDrag: boolean;
  onTrackingNumberChange: (id: string, value: string) => void;
  onCourierChange: (id: string, code: string, name?: string) => void;
  onRemove: (id: string) => void;
}

export function SortableTrackingField({
  field,
  index,
  canRemove,
  canDrag,
  onTrackingNumberChange,
  onCourierChange,
  onRemove,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      {/* Drag handle */}
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab touch-none text-zinc-400 transition-colors hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}

      {/* Field number */}
      <span className="mt-2.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-[10px] font-semibold text-zinc-500 dark:bg-zinc-800">
        {index + 1}
      </span>

      {/* Inputs */}
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <input
            type="text"
            value={field.trackingNumber}
            onChange={(e) =>
              onTrackingNumberChange(field.id, e.target.value)
            }
            placeholder="Enter tracking number"
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          {field.isDetecting && (
            <span className="absolute right-3 top-2.5 flex items-center gap-1 text-xs text-zinc-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Detecting
            </span>
          )}
        </div>

        {/* Courier dropdown */}
        <select
          value={field.courierCode}
          onChange={(e) => {
            const selected = field.detectedCouriers.find(
              (c) => c.code === e.target.value
            );
            onCourierChange(field.id, e.target.value, selected?.name);
          }}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm transition-colors focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 sm:w-48 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        >
          <option value="">
            {field.isDetecting
              ? "Detecting..."
              : field.detectedCouriers.length
                ? "Select courier"
                : "Enter tracking # first"}
          </option>
          {field.detectedCouriers.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Remove button */}
      {canRemove && (
        <button
          onClick={() => onRemove(field.id)}
          className="mt-1.5 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
