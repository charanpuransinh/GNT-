// GNT M20 — Frontend DTOs & Types
// Owner: D4-DELTA

export type TradeType = 'import' | 'export';
export type TradeStatus = 'draft' | 'submitted' | 'under_review' | 'customs_cleared' | 'completed' | 'cancelled';
export type DocumentType = 'boe' | 'shipping_bill' | 'commercial_invoice' | 'packing_list' | 'certificate_of_origin';
export type DocumentStatus = 'generated' | 'signed' | 'submitted' | 'approved' | 'rejected';

export interface HSNItem {
  id: string;
  code: string;
  description: string;
  chapter: string;
  heading: string;
  subheading: string;
  tariff_item: string;
  gst_rate: number;
  igst_rate: number;
  cess_rate: number;
  is_active: boolean;
}

export interface TradeJob {
  id: string;
  company_id: string;
  type: TradeType;
  reference_no: string;
  party_id: string;
  product_id: string;
  hsn_code: string;
  quantity: number;
  value_fob: number | null;
  value_cif: number | null;
  currency: string;
  fx_rate: number;
  customs_duty: number | null;
  gst_amount: number | null;
  status: TradeStatus;
  created_at: string;
  updated_at: string;
  hsn?: HSNItem;
  documents?: TradeDocument[];
}

export interface PaginatedTradeJobs {
  data: TradeJob[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FXRate {
  id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  effective_date: string;
}

export interface FXConvertResult {
  original_amount: number;
  converted_amount: number;
  rate: number;
  from_currency: string;
  to_currency: string;
}

export interface CustomsDutyBreakdown {
  hsn_code: string;
  assessable_value_inr: number;
  bcd: number;
  acd: number;
  sad: number;
  cvd: number;
  anti_dumping: number;
  safeguard: number;
  igst: number;
  cess: number;
  total_duty: number;
  breakup: Array<{
    label: string;
    rate: number;
    amount: number;
  }>;
}

export interface TradeDocument {
  id: string;
  trade_job_id: string;
  document_type: DocumentType;
  content_json: Record<string, unknown>;
  generated_at: string;
  status: DocumentStatus;
  file_url: string | null;
}

export interface CreateShipmentRequest {
  type: TradeType;
  reference_no: string;
  party_id: string;
  product_id: string;
  hsn_code: string;
  quantity: number;
  value_fob?: number;
  value_cif?: number;
  currency?: string;
  fx_rate?: number;
}

export interface HSNValidationResult {
  valid: boolean;
  code: string;
  message: string;
  suggested_codes: HSNItem[];
}
