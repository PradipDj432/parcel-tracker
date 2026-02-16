import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function GET() {
  // Auth check — only admins
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Use service role to bypass RLS and get everything
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all data in parallel
  const [usersRes, trackingsRes, contactRes] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    admin
      .from("trackings")
      .select("*")
      .order("updated_at", { ascending: false }),
    admin
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const users = usersRes.data ?? [];
  const trackings = trackingsRes.data ?? [];
  const contacts = contactRes.data ?? [];

  // Compute per-user tracking counts
  const trackingsByUser: Record<string, number> = {};
  for (const t of trackings) {
    if (t.user_id) {
      trackingsByUser[t.user_id] = (trackingsByUser[t.user_id] || 0) + 1;
    }
  }

  // Compute per-user last activity (latest tracking updated_at)
  const lastActiveByUser: Record<string, string> = {};
  for (const t of trackings) {
    if (t.user_id) {
      if (
        !lastActiveByUser[t.user_id] ||
        t.updated_at > lastActiveByUser[t.user_id]
      ) {
        lastActiveByUser[t.user_id] = t.updated_at;
      }
    }
  }

  // Enrich users
  const enrichedUsers = users.map((u) => ({
    ...u,
    tracking_count: trackingsByUser[u.id] || 0,
    last_active: lastActiveByUser[u.id] || null,
  }));

  // Most active users (top 5)
  const mostActive = [...enrichedUsers]
    .sort((a, b) => b.tracking_count - a.tracking_count)
    .slice(0, 5);

  // Status breakdown
  const statusBreakdown: Record<string, number> = {};
  for (const t of trackings) {
    statusBreakdown[t.status] = (statusBreakdown[t.status] || 0) + 1;
  }

  // Courier breakdown
  const courierBreakdown: Record<string, number> = {};
  for (const t of trackings) {
    courierBreakdown[t.courier_code] =
      (courierBreakdown[t.courier_code] || 0) + 1;
  }

  return NextResponse.json({
    users: enrichedUsers,
    trackings,
    contacts,
    stats: {
      totalUsers: users.length,
      totalTrackings: trackings.length,
      totalContacts: contacts.length,
      mostActive,
      statusBreakdown,
      courierBreakdown,
    },
  });
}
