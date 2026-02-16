import { NextRequest, NextResponse } from "next/server";
import { trackParcel } from "@/lib/trackingmore";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumber, courierCode } = body;

    if (!trackingNumber || !courierCode) {
      return NextResponse.json(
        { error: "Tracking number and courier code are required" },
        { status: 400 }
      );
    }

    // Call TrackingMore API (secrets stay server-side)
    const result = await trackParcel(trackingNumber, courierCode);

    // If user is logged in, save to database
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Check if tracking already exists for this user
      const { data: existing } = await supabase
        .from("trackings")
        .select("id")
        .eq("user_id", user.id)
        .eq("tracking_number", trackingNumber)
        .eq("courier_code", courierCode)
        .single();

      if (existing) {
        // Update existing tracking
        await supabase
          .from("trackings")
          .update({
            status: result.status,
            last_event: result.last_event || null,
            origin: result.origin || null,
            destination: result.destination || null,
            checkpoints: result.checkpoints,
          })
          .eq("id", existing.id);
      } else {
        // Insert new tracking
        await supabase.from("trackings").insert({
          user_id: user.id,
          tracking_number: result.tracking_number,
          courier_code: result.courier_code,
          status: result.status,
          last_event: result.last_event || null,
          origin: result.origin || null,
          destination: result.destination || null,
          checkpoints: result.checkpoints,
        });
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to track parcel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
