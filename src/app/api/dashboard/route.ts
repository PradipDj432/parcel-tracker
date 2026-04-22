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
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const validDate = (s: string | null | undefined): number | null => {
    if (!s) return null;
    const t = new Date(s).getTime();
    return Number.isNaN(t) ? null : t;
  };

  // Summary stats
  const total = all.length;
  const inTransit = all.filter((t) => t.status === "transit").length;
  const deliveredThisMonth = all.filter((t) => {
    if (t.status !== "delivered") return false;
    const updated = validDate(t.updated_at);
    return updated !== null && updated >= startOfMonth.getTime();
  }).length;

  // Average delivery time (delivered parcels with both created_at and updated_at)
  const deliveredWithDates = all.filter(
    (t) =>
      t.status === "delivered" &&
      validDate(t.created_at) !== null &&
      validDate(t.updated_at) !== null
  );
  let avgDeliveryDays = 0;
  if (deliveredWithDates.length > 0) {
    const totalDays = deliveredWithDates.reduce((sum, t) => {
      const created = validDate(t.created_at)!;
      const updated = validDate(t.updated_at)!;
      return sum + (updated - created) / (1000 * 60 * 60 * 24);
    }, 0);
    avgDeliveryDays = Math.round((totalDays / deliveredWithDates.length) * 10) / 10;
  }

  // Tracking volume per day (last 30 days)
  const volumeMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = date.toISOString().split("T")[0];
    volumeMap[key] = 0;
  }
  for (const t of all) {
    const created = validDate(t.created_at);
    if (created === null) continue;
    const key = new Date(created).toISOString().split("T")[0];
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
    .sort((a, b) => (validDate(b.updated_at) ?? 0) - (validDate(a.updated_at) ?? 0));

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
