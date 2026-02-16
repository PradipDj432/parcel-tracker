import { createClient } from "@/lib/supabase/server";
import { HistoryList } from "@/components/history-list";
import { HistorySkeleton } from "@/components/history-skeleton";
import { Suspense } from "react";
import type { Parcel } from "@/types";

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Tracking History</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          View and manage all your tracked parcels.
        </p>
        <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300">
          <strong>Tip:</strong> Click the lock icon next to any tracking to make it public and get a shareable link with QR code. Click the share icon to make it private again.
        </div>
      </div>

      <Suspense fallback={<HistorySkeleton />}>
        <HistoryData />
      </Suspense>
    </div>
  );
}

async function HistoryData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: trackings } = await supabase
    .from("trackings")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return <HistoryList initialTrackings={(trackings as Parcel[]) || []} />;
}
