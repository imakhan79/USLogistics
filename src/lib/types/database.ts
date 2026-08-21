export type LoadStatus = "booked" | "covered" | "pickup" | "in_transit" | "delivered" | "cancelled";
export type RiskLevel = "ok" | "warning" | "critical";
export type ExceptionSeverity = "warning" | "critical";
export type ExceptionCategory = "carrier_cancellation" | "late_pickup" | "low_margin" | "missing_documents" | "other";
export type ExceptionStatus = "open" | "acknowledged" | "resolved" | "dismissed";
export type RecommendationStatus = "pending" | "approved" | "dismissed";
export type RecommendationAction = "assign_carrier" | "optimize_backhaul" | "cover_load" | "other";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  tenant_id: string;
  full_name: string | null;
  role: "owner" | "admin" | "dispatcher" | "driver" | "viewer";
  avatar_url: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_address: string | null;
  status: "active" | "inactive";
  created_at: string;
}

export interface Carrier {
  id: string;
  tenant_id: string;
  name: string;
  mc_number: string | null;
  dot_number: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  safety_rating: string | null;
  insurance_expiry: string | null;
  status: "active" | "inactive" | "flagged";
  created_at: string;
}

export interface Driver {
  id: string;
  tenant_id: string;
  carrier_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | null;
  status: "active" | "off_duty" | "inactive";
  created_at: string;
}

export interface Truck {
  id: string;
  tenant_id: string;
  unit_number: string;
  equipment_type: "truck" | "trailer";
  make: string | null;
  model: string | null;
  year: number | null;
  plate: string | null;
  status: "available" | "in_transit" | "maintenance" | "out_of_service";
  current_driver_id: string | null;
  created_at: string;
}

export interface Load {
  id: string;
  tenant_id: string;
  load_number: string;
  customer_id: string | null;
  carrier_id: string | null;
  driver_id: string | null;
  truck_id: string | null;
  status: LoadStatus;
  equipment_type: string | null;
  commodity: string | null;
  weight_lbs: number | null;
  pallets: number | null;
  origin_summary: string | null;
  destination_summary: string | null;
  revenue: number;
  carrier_cost: number;
  margin: number;
  risk_score: number;
  risk_level: RiskLevel;
  pickup_date: string | null;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoadStop {
  id: string;
  tenant_id: string;
  load_id: string;
  stop_type: "pickup" | "delivery";
  sequence: number;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  lat: number | null;
  lng: number | null;
  scheduled_at: string | null;
  actual_at: string | null;
  status: "pending" | "in_progress" | "completed" | "delayed";
  created_at: string;
}

export interface ExceptionRow {
  id: string;
  tenant_id: string;
  load_id: string;
  severity: ExceptionSeverity;
  category: ExceptionCategory;
  issue_summary: string;
  sla_deadline: string | null;
  status: ExceptionStatus;
  detected_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface AiRecommendation {
  id: string;
  tenant_id: string;
  load_id: string | null;
  exception_id: string | null;
  recommendation_text: string;
  action_type: RecommendationAction;
  estimated_cost: number | null;
  estimated_delay_minutes: number | null;
  confidence_score: number | null;
  model: string | null;
  status: RecommendationStatus;
  created_at: string;
}

export interface Document {
  id: string;
  tenant_id: string;
  load_id: string | null;
  carrier_id: string | null;
  name: string;
  doc_type: string;
  file_url: string | null;
  status: "pending" | "validated" | "active" | "expired";
  ocr_text: string | null;
  uploaded_by: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface AiAgent {
  id: string;
  tenant_id: string;
  key: string;
  name: string;
  description: string;
  autonomy_level: 0 | 1 | 2 | 3;
  enabled: boolean;
  created_at: string;
}

export type QuoteStatus = "draft" | "quoted" | "sent" | "approved" | "rejected" | "converted" | "expired";

export interface Quote {
  id: string;
  tenant_id: string;
  quote_number: string;
  customer_id: string | null;
  origin_summary: string;
  destination_summary: string;
  equipment_type: string;
  commodity: string | null;
  weight_lbs: number | null;
  miles: number;
  deadhead_miles: number;
  carrier_cost_estimate: number;
  fuel_cost_estimate: number;
  deadhead_cost_estimate: number;
  accessorial_cost_estimate: number;
  other_cost_estimate: number;
  total_cost_estimate: number;
  target_margin_pct: number;
  recommended_rate: number | null;
  minimum_rate: number | null;
  expected_margin: number;
  risk_score: number;
  ai_rationale: string | null;
  ai_model: string | null;
  status: QuoteStatus;
  converted_load_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  customer_id: string | null;
  load_id: string | null;
  invoice_number: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  due_date: string | null;
  issued_at: string;
  created_at: string;
}
