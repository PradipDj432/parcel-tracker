import { NextRequest, NextResponse } from "next/server";
import { detectCourier } from "@/lib/trackingmore";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { trackingNumber } = body;

    if (!trackingNumber) {
      return NextResponse.json(
        { error: "Tracking number is required" },
        { status: 400 }
      );
    }

    const couriers = await detectCourier(trackingNumber);
    return NextResponse.json({ data: couriers });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to detect courier";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
