import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

const statusColors: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#f4f4f5", text: "#3f3f46" },
  transit: { bg: "#fef3c7", text: "#92400e" },
  delivered: { bg: "#d1fae5", text: "#065f46" },
  exception: { bg: "#fee2e2", text: "#991b1b" },
  expired: { bg: "#f4f4f5", text: "#71717a" },
  notfound: { bg: "#f4f4f5", text: "#71717a" },
  pickup: { bg: "#e0e7ff", text: "#3730a3" },
  undelivered: { bg: "#fee2e2", text: "#991b1b" },
  inforeceived: { bg: "#dbeafe", text: "#1e40af" },
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  transit: "In Transit",
  delivered: "Delivered",
  exception: "Exception",
  expired: "Expired",
  notfound: "Not Found",
  pickup: "Picked Up",
  undelivered: "Undelivered",
  inforeceived: "Info Received",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: tracking } = await supabase
    .from("trackings")
    .select("tracking_number, courier_code, status, last_event")
    .eq("public_slug", id)
    .eq("is_public", true)
    .single();

  if (!tracking) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#18181b",
            color: "#ffffff",
            fontSize: 32,
          }}
        >
          Tracking not found
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  const colors = statusColors[tracking.status] || statusColors.pending;
  const label = statusLabels[tracking.status] || tracking.status;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          color: "#ffffff",
          padding: "60px 80px",
          justifyContent: "space-between",
        }}
      >
        {/* Top: branding */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              backgroundColor: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#09090b",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            PT
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color: "#a1a1aa" }}>
            Parcel Tracker
          </span>
        </div>

        {/* Middle: tracking info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 20, color: "#71717a", textTransform: "uppercase" }}>
            Tracking Number
          </div>
          <div style={{ fontSize: 52, fontWeight: 700, fontFamily: "monospace" }}>
            {tracking.tracking_number}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                padding: "8px 20px",
                borderRadius: 999,
                backgroundColor: colors.bg,
                color: colors.text,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
            <span style={{ fontSize: 22, color: "#a1a1aa" }}>
              {tracking.courier_code.toUpperCase()}
            </span>
          </div>
          {tracking.last_event && (
            <div style={{ fontSize: 20, color: "#a1a1aa", maxWidth: "900px" }}>
              {tracking.last_event}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div style={{ fontSize: 18, color: "#52525b" }}>
          Shared via Parcel Tracker
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
