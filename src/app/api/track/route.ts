import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { trackParcel } from "@/lib/trackingmore";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

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

    // Check if user is logged in
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let saved = false;
    let saveError: string | null = null;

    if (user) {
      // Use service role client to bypass RLS for reliable writes
      // (user identity already verified via getUser above)
      const admin = createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Check if tracking already exists for this user
      const { data: existing } = await admin
        .from("trackings")
        .select("id")
        .eq("user_id", user.id)
        .eq("tracking_number", trackingNumber)
        .eq("courier_code", courierCode)
        .maybeSingle();

      if (existing) {
        // Update existing tracking
        const { error: updateError } = await admin
          .from("trackings")
          .update({
            status: result.status,
            last_event: result.last_event || null,
            origin: result.origin || null,
            destination: result.destination || null,
            checkpoints: result.checkpoints,
          })
          .eq("id", existing.id);
        if (updateError) {
          console.error("Failed to update tracking:", updateError.message);
          saveError = updateError.message;
        } else {
          saved = true;
        }
      } else {
        // Insert new tracking with unique public slug
        const { error: insertError } = await admin.from("trackings").insert({
          user_id: user.id,
          tracking_number: result.tracking_number,
          courier_code: result.courier_code,
          status: result.status,
          last_event: result.last_event || null,
          origin: result.origin || null,
          destination: result.destination || null,
          checkpoints: result.checkpoints,
          public_slug: nanoid(10),
        });
        if (insertError) {
          console.error("Failed to insert tracking:", insertError.message);
          saveError = insertError.message;
        } else {
          saved = true;
        }
      }
    }

    return NextResponse.json({ data: result, saved, saveError });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to track parcel";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
