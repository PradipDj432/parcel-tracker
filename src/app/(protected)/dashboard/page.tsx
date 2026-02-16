import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "@/components/dashboard-client";
import { Suspense } from "react";
import { HistorySkeleton } from "@/components/history-skeleton";
import type { Parcel } from "@/types";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Overview of your tracked parcels.
        </p>
      </div>

      <Suspense fallback={<HistorySkeleton />}>
        <DashboardData />
      </Suspense>
    </div>
  );
}

async function DashboardData() {
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

  return <DashboardClient initialTrackings={(trackings as Parcel[]) || []} />;
}
