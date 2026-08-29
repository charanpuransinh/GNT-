export const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'income', 'expense'] as const;

export const VOUCHER_TYPES = [
  'journal',
  'cash_payment',
  'cash_receipt',
  'bank_payment',
  'bank_receipt',
  'contra',
] as const;

export const STANDARD_ACCOUNTS = [
  { name: 'Cash', code: 'CASH001', type: 'asset' },
  { name: 'Bank', code: 'BANK001', type: 'asset' },
  { name: 'Sales', code: 'SALE001', type: 'income' },
  { name: 'Purchase', code: 'PUR001', type: 'expense' },
  { name: 'GST Output', code: 'GSTOUT001', type: 'liability' },
  { name: 'GST Input', code: 'GSTIN001', type: 'asset' },
];

export const VOUCHER_STATUS = {
  DRAFT: 'draft',
  POSTED: 'posted',
  CANCELLED: 'cancelled',
} as const;

export const BRS_STATUS = {
  PENDING: 'pending',
  RECONCILED: 'reconciled',
} as const;
