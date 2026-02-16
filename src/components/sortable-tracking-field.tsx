"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
      className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950"
    >
      {/* Drag handle */}
      {canDrag && (
        <button
          {...attributes}
          {...listeners}
          className="mt-2 cursor-grab touch-none text-zinc-400 hover:text-zinc-600 active:cursor-grabbing dark:hover:text-zinc-300"
          aria-label="Drag to reorder"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
      )}

      {/* Field number */}
      <span className="mt-2 text-xs font-medium text-zinc-400">
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
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          />
          {field.isDetecting && (
            <span className="absolute right-3 top-2.5 text-xs text-zinc-400">
              Detecting...
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
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 sm:w-48 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
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
          className="mt-1.5 rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          aria-label="Remove"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
}
