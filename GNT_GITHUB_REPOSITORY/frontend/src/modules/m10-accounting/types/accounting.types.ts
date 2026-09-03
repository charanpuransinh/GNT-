// ============================================================================
// M10 ACCOUNTING — Frontend Types (ROUGH)
// ============================================================================

export interface VoucherItem {
  account_id: string;
  debit_amount?: number;
  credit_amount?: number;
  narration?: string;
}

export interface Voucher {
  id: string;
  voucher_no?: string;
  type?: string;
  total_debit?: number;
  total_credit?: number;
  status?: string;
  created_at?: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  transaction_date?: string;
  narration?: string | null;
  debit_amount?: number;
  credit_amount?: number;
  party_id?: string | null;
}

export interface Account {
  id: string;
  name: string;
  code: string;
}

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  meta?: { total?: number };
}
