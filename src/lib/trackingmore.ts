const TRACKINGMORE_API_KEY = process.env.TRACKINGMORE_API_KEY!;
const TRACKINGMORE_BASE_URL = "https://api.trackingmore.com/v4";

export async function trackParcel(trackingNumber: string, courier: string) {
  // TODO: implement TrackingMore API call
  return { trackingNumber, courier };
}

export async function detectCourier(trackingNumber: string) {
  // TODO: implement courier auto-detection
  return { trackingNumber };
}
