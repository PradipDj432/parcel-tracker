import type {
  TrackingResult,
  TrackingCheckpoint,
  DetectedCourier,
} from "@/types";

const API_KEY = process.env.TRACKINGMORE_API_KEY!;
const BASE_URL = "https://api.trackingmore.com/v4";

const headers = {
  "Content-Type": "application/json",
  "Tracking-Api-Key": API_KEY,
};

interface TrackingMoreResponse {
  meta: { code: number; type: string; message: string };
  data: Record<string, unknown>;
}

interface DetectResponse {
  meta: { code: number; type: string; message: string };
  data: Array<{ courier_name: string; courier_code: string }>;
}

/**
 * Create a tracking and get real-time results (V4 "create & get").
 */
export async function trackParcel(
  trackingNumber: string,
  courierCode: string,
): Promise<TrackingResult> {
  const res = await fetch(`${BASE_URL}/trackings/create`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tracking_number: trackingNumber,
      courier_code: courierCode,
    }),
  });

  const json: TrackingMoreResponse = await res.json();

  // If tracking already exists, try to get it instead
  if (json.meta.code === 4016) {
    return getTracking(trackingNumber, courierCode);
  }

  if (json.meta.code !== 200) {
    throw new Error(json.meta.message || "Failed to track parcel");
  }

  return normalizeTrackingData(json.data);
}

/**
 * Get existing tracking results.
 */
export async function getTracking(
  trackingNumber: string,
  courierCode: string,
): Promise<TrackingResult> {
  const res = await fetch(
    `${BASE_URL}/trackings/${courierCode}/${trackingNumber}`,
    { method: "GET", headers },
  );

  const json: TrackingMoreResponse = await res.json();

  if (json.meta.code !== 200) {
    throw new Error(json.meta.message || "Failed to get tracking");
  }

  return normalizeTrackingData(json.data);
}

/**
 * Detect possible couriers for a tracking number.
 */
export async function detectCourier(
  trackingNumber: string,
): Promise<DetectedCourier[]> {
  const res = await fetch(`${BASE_URL}/couriers/detect`, {
    method: "POST",
    headers,
    body: JSON.stringify({ tracking_number: trackingNumber }),
  });

  const json: DetectResponse = await res.json();

  if (json.meta.code !== 200 || !json.data) {
    return [];
  }

  return json.data.map((c) => ({ name: c.courier_name, code: c.courier_code }));
}

/**
 * Normalize the TrackingMore API response into our internal format.
 */
function normalizeTrackingData(data: Record<string, unknown>): TrackingResult {
  const checkpointsRaw = (data.origin_info as Record<string, unknown>)
    ?.trackinfo as Array<Record<string, unknown>> | undefined;

  const destinationRaw = (data.destination_info as Record<string, unknown>)
    ?.trackinfo as Array<Record<string, unknown>> | undefined;

  const allCheckpoints: TrackingCheckpoint[] = [];

  // Combine origin and destination checkpoints
  if (destinationRaw?.length) {
    for (const cp of destinationRaw) {
      allCheckpoints.push({
        date: (cp.checkpoint_date as string) || (cp.Date as string) || "",
        description:
          (cp.tracking_detail as string) ||
          (cp.StatusDescription as string) ||
          "",
        location: (cp.location as string) || "",
        status: (cp.checkpoint_delivery_status as string) || "",
      });
    }
  }

  if (checkpointsRaw?.length) {
    for (const cp of checkpointsRaw) {
      allCheckpoints.push({
        date: (cp.checkpoint_date as string) || (cp.Date as string) || "",
        description:
          (cp.tracking_detail as string) ||
          (cp.StatusDescription as string) ||
          "",
        location: (cp.location as string) || "",
        status: (cp.checkpoint_delivery_status as string) || "",
      });
    }
  }

  // Sort checkpoints by date (newest first)
  allCheckpoints.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return {
    tracking_number: data.tracking_number as string,
    courier_code: data.courier_code as string,
    courier_name: (data.courier_name as string) || undefined,
    status: (data.delivery_status as TrackingResult["status"]) || "pending",
    last_event: allCheckpoints[0]?.description || undefined,
    origin: (data.origin as string) || undefined,
    destination: (data.destination as string) || undefined,
    estimated_delivery: (data.scheduled_delivery_date as string) || undefined,
    checkpoints: allCheckpoints,
  };
}
