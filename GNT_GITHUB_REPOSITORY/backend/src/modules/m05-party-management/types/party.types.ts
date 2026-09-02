// ============================================================================
// M05 PARTY MANAGEMENT — Public Types
// Party = दुकानदार का ग्राहक/सप्लायर (company_master वाली कंपनी नहीं — वो M04 है)
// टास्क #007 — समीक्षक AI के डिज़ाइन के हिसाब से
// ============================================================================

export type PartyType = 'customer' | 'supplier' | 'both';

export interface Party {
  id: string;
  company_id: string;
  branch_id: string | null;
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
  created_at: Date;
  updated_at: Date;
  created_by: string | null;
  updated_by: string | null;
}

export interface CreatePartyDTO {
  party_type: PartyType;
  name: string;
  display_name?: string | null;
  gstin?: string | null;
  pan?: string | null;
  gst_type?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  alt_phone?: string | null;
  email?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  city?: string | null;
  state_code?: string | null;
  pincode?: string | null;
  country?: string;
  credit_limit?: number;
  credit_days?: number;
  opening_balance?: number;
  opening_type?: 'dr' | 'cr';
  notes?: string | null;
  branch_id?: string | null;
}

export interface UpdatePartyDTO {
  party_type?: PartyType;
  name?: string;
  display_name?: string | null;
  gstin?: string | null;
  pan?: string | null;
  gst_type?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  alt_phone?: string | null;
  email?: string | null;
  billing_address?: string | null;
  shipping_address?: string | null;
  city?: string | null;
  state_code?: string | null;
  pincode?: string | null;
  country?: string;
  credit_limit?: number;
  credit_days?: number;
  opening_balance?: number;
  opening_type?: 'dr' | 'cr';
  notes?: string | null;
  is_active?: boolean;
}

export interface PartyQuery {
  party_type?: PartyType;
  search?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}

/** M10 से गिनकर आएगा — party table में store नहीं होता (डिज़ाइन फ़ैसला 3) */
export interface PartyOutstanding {
  party_id: string;
  outstanding: number; // dr (+) / cr (−) नहीं — सिर्फ़ राशि, दिशा opening_type/बही से
  currency: string;
  as_on: Date;
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

export interface CreditCheckResult {
  allowed: boolean;
  limit: number;
  used: number;
  available: number;
  reason?: string;
}
