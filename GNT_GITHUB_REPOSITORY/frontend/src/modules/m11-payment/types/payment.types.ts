// ============================================================================
// M11 PAYMENT — Frontend Types (ROUGH)
// ============================================================================

export interface Payment {
  id: string;
  amount?: string | number;
  currency?: string;
  payer_name?: string;
  payer_name_snake?: string;
  payerName?: string;
  status?: string;
  created_at?: string;
}

export interface DueInvoice {
  id: string;
  invoice_number?: string;
  number?: string;
  customer_name?: string;
  due_date?: string;
  total_amount?: string | number;
  amount_due?: string | number;
  outstanding?: string | number;
  status?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta?: { total?: number };
}
