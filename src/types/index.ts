// ---- Database models ----
export interface Parcel {
  id: string;
  tracking_number: string;
  courier_code: string;
  status: string;
  label?: string;
  last_event?: string;
  origin?: string;
  destination?: string;
  checkpoints: TrackingCheckpoint[];
  is_public: boolean;
  public_slug?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// ---- Tracking types ----
export interface TrackingCheckpoint {
  date: string;
  description: string;
  location?: string;
  status: string;
}

export interface TrackingResult {
  tracking_number: string;
  courier_code: string;
  courier_name?: string;
  status: TrackingStatus;
  last_event?: string;
  origin?: string;
  destination?: string;
  estimated_delivery?: string;
  checkpoints: TrackingCheckpoint[];
}

export type TrackingStatus =
  | "pending"
  | "notfound"
  | "transit"
  | "pickup"
  | "delivered"
  | "undelivered"
  | "exception"
  | "expired"
  | "inforeceived";

export interface DetectedCourier {
  name: string;
  code: string;
}

// ---- Form types ----
export interface TrackingField {
  id: string;
  trackingNumber: string;
  courierCode: string;
  courierName?: string;
  detectedCouriers: DetectedCourier[];
  isDetecting: boolean;
}

// ---- Contact ----
export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ---- Dashboard ----
export interface DashboardStats {
  total_parcels: number;
  active_parcels: number;
  delivered_parcels: number;
  couriers: Record<string, number>;
}

export type UserRole = "guest" | "user" | "admin";
