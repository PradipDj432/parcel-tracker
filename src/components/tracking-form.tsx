"use client";

import { useState, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableTrackingField } from "@/components/sortable-tracking-field";
import { Plus, Search, Loader2 } from "lucide-react";
import type { TrackingField, TrackingResult } from "@/types";
import { useAuth } from "@/components/auth-provider";
import { toast } from "sonner";

const MAX_FIELDS = 6;
const GUEST_MAX_FIELDS = 1;

function createEmptyField(): TrackingField {
  return {
    id: crypto.randomUUID(),
    trackingNumber: "",
    courierCode: "",
    detectedCouriers: [],
    isDetecting: false,
  };
}

interface TrackingFormProps {
  onResults: (results: TrackingResult[]) => void;
}

export function TrackingForm({ onResults }: TrackingFormProps) {
  const { user } = useAuth();
  const maxFields = user ? MAX_FIELDS : GUEST_MAX_FIELDS;
  const [fields, setFields] = useState<TrackingField[]>([createEmptyField()]);
  const [isTracking, setIsTracking] = useState(false);
  const detectTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const updateField = useCallback(
    (id: string, updates: Partial<TrackingField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const handleTrackingNumberChange = useCallback(
    (id: string, value: string) => {
      updateField(id, { trackingNumber: value, courierCode: "" });

      // Debounced courier detection
      const existing = detectTimers.current.get(id);
      if (existing) clearTimeout(existing);

      if (value.length >= 6) {
        updateField(id, { isDetecting: true });
        const timer = setTimeout(async () => {
          try {
            const res = await fetch("/api/track/detect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ trackingNumber: value }),
            });
            const json = await res.json();
            const couriers = json.data || [];
            updateField(id, {
              detectedCouriers: couriers,
              courierCode: couriers[0]?.code || "",
              courierName: couriers[0]?.name || "",
              isDetecting: false,
            });
          } catch {
            updateField(id, { isDetecting: false });
          }
        }, 500);
        detectTimers.current.set(id, timer);
      } else {
        updateField(id, {
          detectedCouriers: [],
          isDetecting: false,
        });
      }
    },
    [updateField]
  );

  const addField = () => {
    if (fields.length < maxFields) {
      setFields((prev) => [...prev, createEmptyField()]);
    }
  };

  const removeField = (id: string) => {
    if (fields.length > 1) {
      setFields((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFields((prev) => {
        const oldIndex = prev.findIndex((f) => f.id === active.id);
        const newIndex = prev.findIndex((f) => f.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleTrack = async () => {
    const validFields = fields.filter(
      (f) => f.trackingNumber.trim() && f.courierCode
    );

    if (!validFields.length) return;

    setIsTracking(true);
    const results: TrackingResult[] = [];

    let savedCount = 0;
    let saveFailCount = 0;

    for (const field of validFields) {
      try {
        const res = await fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackingNumber: field.trackingNumber.trim(),
            courierCode: field.courierCode,
          }),
        });
        const json = await res.json();
        if (json.data) {
          results.push(json.data);
          if (json.saved) savedCount++;
          else if (json.saveError) saveFailCount++;
        } else if (json.error) {
          results.push({
            tracking_number: field.trackingNumber,
            courier_code: field.courierCode,
            status: "notfound",
            last_event: json.error,
            checkpoints: [],
          });
        }
      } catch {
        results.push({
          tracking_number: field.trackingNumber,
          courier_code: field.courierCode,
          status: "notfound",
          last_event: "Request failed",
          checkpoints: [],
        });
      }
    }

    onResults(results);
    setIsTracking(false);

    if (user && results.length > 0) {
      if (savedCount > 0) {
        toast.success(
          `${savedCount} tracking(s) saved to your history.`
        );
      }
      if (saveFailCount > 0) {
        toast.error(
          `Failed to save ${saveFailCount} tracking(s). Check console for details.`
        );
      }
    }
  };

  const hasValidFields = fields.some(
    (f) => f.trackingNumber.trim() && f.courierCode
  );

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map((f) => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.map((field, index) => (
              <SortableTrackingField
                key={field.id}
                field={field}
                index={index}
                canRemove={fields.length > 1}
                canDrag={fields.length > 1}
                onTrackingNumberChange={handleTrackingNumberChange}
                onCourierChange={(id, code, name) =>
                  updateField(id, { courierCode: code, courierName: name })
                }
                onRemove={removeField}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="flex items-center gap-3">
        {fields.length < maxFields && (
          <button
            type="button"
            onClick={addField}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-4 py-2 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
          >
            <Plus className="h-4 w-4" />
            Add tracking number
          </button>
        )}

        <button
          type="button"
          onClick={handleTrack}
          disabled={!hasValidFields || isTracking}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isTracking ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          {isTracking ? "Tracking..." : "Track"}
        </button>
      </div>

      {!user && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sign in to track up to {MAX_FIELDS} parcels and save your history.
        </p>
      )}
    </div>
  );
}
