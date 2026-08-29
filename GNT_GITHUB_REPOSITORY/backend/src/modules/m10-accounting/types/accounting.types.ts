export interface CreateAccountDTO {
  company_id: string;
  name: string;
  code: string;
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  subtype?: string;
  parent_id?: string;
  opening_balance?: number;
  is_bank_account?: boolean;
  bank_name?: string;
  bank_account_no?: string;
}

export interface CreateVoucherDTO {
  company_id: string;
  branch_id?: string;
  voucher_type: string;
  voucher_number: string;
  voucher_date: Date;
  narration?: string;
  items: Array<{
    account_id: string;
    party_id?: string;
    debit_amount?: number;
    credit_amount?: number;
    narration?: string;
  }>;
}

export interface CreateLedgerEntryDTO {
  company_id: string;
  branch_id?: string;
  voucher_id?: string;
  account_id: string;
  transaction_date: Date;
  narration?: string;
  debit_amount?: number;
  credit_amount?: number;
  reference_type?: string;
  reference_id?: string;
  party_id?: string;
  created_by?: string;
}

export interface CreateBRSDTO {
  company_id: string;
  bank_account_id: string;
  statement_date: Date;
  statement_balance: number;
  ledger_entries: Array<{
    id: string;
    transaction_date: Date;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
  }>;
}

export interface TrialBalanceItemDTO {
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

export interface BRSStatusDTO {
  id: string;
  bank_account_id: string;
  statement_date: Date;
  statement_balance: number;
  ledger_balance: number;
  difference: number;
  status: string;
  unmatched_count: number;
  matched_count: number;
}
