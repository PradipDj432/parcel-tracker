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
