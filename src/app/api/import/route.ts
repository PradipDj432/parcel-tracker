import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { trackParcel } from "@/lib/trackingmore";
import { createClient } from "@/lib/supabase/server";

// Process a single tracking item from CSV import
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { trackingNumber, courierCode, label } = body;

    if (!trackingNumber || !courierCode) {
      return NextResponse.json(
        { error: "Tracking number and courier code are required" },
        { status: 400 }
      );
    }

    // Call TrackingMore API
    const result = await trackParcel(trackingNumber, courierCode);

    // Check if already exists
    const { data: existing, error: lookupError } = await supabase
      .from("trackings")
      .select("id")
      .eq("user_id", user.id)
      .eq("tracking_number", trackingNumber)
      .eq("courier_code", courierCode)
      .single();

    if (existing && !lookupError) {
      const { error: updateError } = await supabase
        .from("trackings")
        .update({
          status: result.status,
          last_event: result.last_event || null,
          origin: result.origin || null,
          destination: result.destination || null,
          checkpoints: result.checkpoints,
          label: label || null,
        })
        .eq("id", existing.id);
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
    } else {
      const { error: insertError } = await supabase.from("trackings").insert({
        user_id: user.id,
        tracking_number: result.tracking_number,
        courier_code: result.courier_code,
        status: result.status,
        last_event: result.last_event || null,
        origin: result.origin || null,
        destination: result.destination || null,
        checkpoints: result.checkpoints,
        label: label || null,
        public_slug: nanoid(10),
      });
      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
    }

    return NextResponse.json({
      success: true,
      trackingNumber,
      status: result.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Import failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
