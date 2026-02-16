import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: trackings } = await supabase
    .from("trackings")
    .select("*")
    .eq("user_id", user.id);

  const all = trackings || [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Summary stats
  const total = all.length;
  const inTransit = all.filter((t) => t.status === "transit").length;
  const deliveredThisMonth = all.filter(
    (t) =>
      t.status === "delivered" && new Date(t.updated_at) >= startOfMonth
  ).length;

  // Average delivery time (delivered parcels with both created_at and updated_at)
  const deliveredParcels = all.filter((t) => t.status === "delivered");
  let avgDeliveryDays = 0;
  if (deliveredParcels.length > 0) {
    const totalDays = deliveredParcels.reduce((sum, t) => {
      const created = new Date(t.created_at).getTime();
      const updated = new Date(t.updated_at).getTime();
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDeliveryDays = Math.round((totalDays / deliveredParcels.length) * 10) / 10;
  }

  // Tracking volume per day (last 30 days)
  const volumeMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split("T")[0];
    volumeMap[key] = 0;
  }
  for (const t of all) {
    const key = new Date(t.created_at).toISOString().split("T")[0];
    if (key in volumeMap) {
      volumeMap[key]++;
    }
  }
  const dailyVolume = Object.entries(volumeMap).map(([date, count]) => ({
    date,
    count,
  }));

  // Courier breakdown with delivery success rate
  const courierMap: Record<
    string,
    { total: number; delivered: number }
  > = {};
  for (const t of all) {
    if (!courierMap[t.courier_code]) {
      courierMap[t.courier_code] = { total: 0, delivered: 0 };
    }
    courierMap[t.courier_code].total++;
    if (t.status === "delivered") {
      courierMap[t.courier_code].delivered++;
    }
  }
  const courierBreakdown = Object.entries(courierMap)
    .map(([courier, data]) => ({
      courier,
      total: data.total,
      delivered: data.delivered,
      successRate:
        data.total > 0
          ? Math.round((data.delivered / data.total) * 100)
          : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // In-transit parcels
  const inTransitParcels = all
    .filter((t) => t.status === "transit")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

  return NextResponse.json({
    summary: {
      total,
      inTransit,
      deliveredThisMonth,
      avgDeliveryDays,
    },
    dailyVolume,
    courierBreakdown,
    inTransitParcels,
  });
}
