"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Parcel } from "@/types";

type RealtimePayload = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: Parcel;
  old: { id: string };
};

interface UseRealtimeTrackingsOptions {
  userId: string | undefined;
  onInsert?: (parcel: Parcel) => void;
  onUpdate?: (parcel: Parcel) => void;
  onDelete?: (id: string) => void;
}

export function useRealtimeTrackings({
  userId,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeTrackingsOptions) {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    const channel = supabase
      .channel("trackings-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trackings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          onInsert?.(p.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trackings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          onUpdate?.(p.new);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "trackings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const p = payload as unknown as RealtimePayload;
          onDelete?.(p.old.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onInsert, onUpdate, onDelete]);
}
