export interface Parcel {
  id: string;
  tracking_number: string;
  courier: string;
  status: string;
  label?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TrackingEvent {
  date: string;
  description: string;
  location?: string;
  status: string;
}

export interface TrackingResult {
  tracking_number: string;
  courier: string;
  status: string;
  events: TrackingEvent[];
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export interface DashboardStats {
  total_parcels: number;
  active_parcels: number;
  delivered_parcels: number;
  couriers: Record<string, number>;
}

export type UserRole = "guest" | "user" | "admin";
