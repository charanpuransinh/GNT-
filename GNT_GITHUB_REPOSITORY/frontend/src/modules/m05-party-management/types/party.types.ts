// ============================================================================
// M05 PARTY MANAGEMENT — Frontend Types (टास्क #007, ROUGH)
// backend के public contract (Party) के हिसाब से
// ============================================================================

export type PartyType = 'customer' | 'supplier' | 'both';

export interface Party {
  id: string;
  company_id: string;
  party_type: PartyType;
  name: string;
  display_name: string | null;
  gstin: string | null;
  pan: string | null;
  gst_type: string | null;
  contact_person: string | null;
  phone: string | null;
  alt_phone: string | null;
  email: string | null;
  billing_address: string | null;
  shipping_address: string | null;
  city: string | null;
  state_code: string | null;
  pincode: string | null;
  country: string;
  credit_limit: number;
  credit_days: number;
  opening_balance: number;
  opening_type: 'dr' | 'cr';
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PartyListResponse {
  success: boolean;
  data: Party[];
  meta: { total: number; page: number; limit: number };
}

export interface PartyDetailResponse {
  success: boolean;
  data: Party;
}

export interface PartyOutstanding {
  party_id: string;
  outstanding: number;
  currency: string;
  as_on: string;
}

export interface PartyAging {
  party_id: string;
  not_due: number;
  due_1_30: number;
  due_31_60: number;
  due_61_90: number;
  due_over_90: number;
  total: number;
}
