export const ACCOUNTING_EVENTS = {
  LEDGER_ENTRY_CREATED: 'ledger.entry.created',
  VOUCHER_POSTED: 'voucher.posted',
} as const;

export interface LedgerEntryCreatedEvent {
  ledger_id: string;
  account_id: string;
  debit: number;
  credit: number;
  reference_type: string;
  reference_id: string;
}

export interface VoucherPostedEvent {
  voucher_id: string;
  voucher_type: string;
  total_debit: number;
  total_credit: number;
}
