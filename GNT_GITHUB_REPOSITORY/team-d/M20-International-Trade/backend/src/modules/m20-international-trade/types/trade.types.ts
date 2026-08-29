// GNT M20 — Trade Types & DTOs
// Owner: D4-DELTA

export type TradeType = 'import' | 'export';
export type TradeStatus = 'draft' | 'submitted' | 'under_review' | 'customs_cleared' | 'completed' | 'cancelled';
export type DocumentType = 'boe' | 'shipping_bill' | 'commercial_invoice' | 'packing_list' | 'certificate_of_origin';
export type DocumentStatus = 'generated' | 'signed' | 'submitted' | 'approved' | 'rejected';

// ── HSN ──
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

export interface HSNValidationRequest {
  code: string;
  product_description: string;
}

export interface HSNValidationResponse {
  valid: boolean;
  code: string;
  message: string;
  suggested_codes: HSNItem[];
}

// ── Trade Job ──
export interface CreateTradeShipmentRequest {
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

export interface TradeJobResponse {
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
}

export interface PaginatedTradeJobs {
  data: TradeJobResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── FX ──
export interface FXRate {
  id: string;
  company_id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  source: string;
  effective_date: string;
}

export interface FXConvertRequest {
  amount: number;
  from_currency: string;
  to_currency: string;
}

export interface FXConvertResponse {
  original_amount: number;
  converted_amount: number;
  rate: number;
  from_currency: string;
  to_currency: string;
}

// ── Customs ──
export interface CustomsCalculateRequest {
  hsn_code: string;
  assessable_value: number;
  currency: string;
  fx_rate?: number;
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

export interface CustomsRule {
  id: string;
  company_id: string;
  hsn_code: string;
  bcd_rate: number;
  acd_rate: number;
  sad_rate: number;
  cvd_rate: number;
  anti_dumping_rate: number;
  safeguard_duty: number;
  effective_from: string;
  effective_to: string | null;
}

// ── Documents ──
export interface GenerateDocumentRequest {
  trade_job_id: string;
  document_type: DocumentType;
  metadata?: Record<string, unknown>;
}

export interface TradeDocument {
  id: string;
  company_id: string;
  trade_job_id: string;
  document_type: DocumentType;
  content_json: Record<string, unknown>;
  generated_at: string;
  status: DocumentStatus;
  file_url: string | null;
}

// ── Events ──
export interface TradeEventPayload {
  trade_job_id: string;
  company_id: string;
  type: TradeType;
  reference_no: string;
  timestamp: string;
}

export interface FXRateUpdatedPayload {
  company_id: string;
  base_currency: string;
  target_currency: string;
  rate: number;
  effective_date: string;
}

export interface CustomsDutyCalculatedPayload {
  trade_job_id: string;
  hsn_code: string;
  total_duty: number;
  timestamp: string;
}
