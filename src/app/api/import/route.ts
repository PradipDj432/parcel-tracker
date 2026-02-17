import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { trackParcel } from "@/lib/trackingmore";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

    // Use service role client for reliable DB writes
    const admin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if already exists
    const { data: existing } = await admin
      .from("trackings")
      .select("id")
      .eq("user_id", user.id)
      .eq("tracking_number", trackingNumber)
      .eq("courier_code", courierCode)
      .maybeSingle();

    if (existing) {
      const { error: updateError } = await admin
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
      const { error: insertError } = await admin.from("trackings").insert({
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
