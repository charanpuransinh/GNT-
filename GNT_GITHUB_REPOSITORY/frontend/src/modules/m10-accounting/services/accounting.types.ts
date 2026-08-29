export interface AccountDTO {
  id: string;
  company_id: string;
  name: string;
  code: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subtype?: string;
  parent_id?: string;
  opening_balance: number;
  current_balance: number;
  is_bank_account: boolean;
  bank_name?: string;
  bank_account_no?: string;
}

export interface VoucherItemDTO {
  account_id: string;
  party_id?: string;
  debit_amount: number;
  credit_amount: number;
  narration?: string;
}

export interface VoucherDTO {
  id: string;
  company_id: string;
  branch_id?: string;
  voucher_type: string;
  voucher_number: string;
  voucher_date: string;
  total_debit: number;
  total_credit: number;
  narration?: string;
  status: 'draft' | 'posted' | 'cancelled';
  items: VoucherItemDTO[];
}

export interface LedgerEntryDTO {
  id: string;
  transaction_date: string;
  narration?: string;
  debit_amount: number;
  credit_amount: number;
  balance: number;
  reference_type?: string;
  reference_id?: string;
}

export interface TrialBalanceDTO {
  id: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
}

export interface ProfitLossDTO {
  income: number;
  expense: number;
  net_profit: number;
}

export interface BalanceSheetDTO {
  assets: number;
  liabilities: number;
  equity: number;
  balanced: boolean;
}

export interface BRSDTO {
  id: string;
  bank_account_id: string;
  statement_date: string;
  statement_balance: number;
  ledger_balance: number;
  difference: number;
  status: 'pending' | 'reconciled';
}
