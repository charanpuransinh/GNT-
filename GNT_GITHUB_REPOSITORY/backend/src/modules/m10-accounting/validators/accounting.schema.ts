import { z } from 'zod';

export const accountSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(100),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  subtype: z.string().max(100).optional(),
  parent_id: z.string().uuid().optional(),
  opening_balance: z.number().default(0),
  is_bank_account: z.boolean().default(false),
  bank_name: z.string().max(100).optional(),
  bank_account_no: z.string().max(100).optional(),
});

export const voucherItemSchema = z.object({
  account_id: z.string().uuid(),
  party_id: z.string().uuid().optional(),
  debit_amount: z.number().min(0).default(0),
  credit_amount: z.number().min(0).default(0),
  narration: z.string().optional(),
});

export const voucherSchema = z.object({
  company_id: z.string().uuid(),
  branch_id: z.string().uuid().optional(),
  voucher_type: z.enum(['journal', 'cash_payment', 'cash_receipt', 'bank_payment', 'bank_receipt', 'contra']),
  voucher_number: z.string().min(1).max(100),
  voucher_date: z.string().datetime(),
  narration: z.string().optional(),
  items: z.array(voucherItemSchema).min(2),
}).refine((data) => {
  const totalDebit = data.items.reduce((sum, i) => sum + i.debit_amount, 0);
  const totalCredit = data.items.reduce((sum, i) => sum + i.credit_amount, 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, { message: 'Total debit must equal total credit' });

export const brsSchema = z.object({
  company_id: z.string().uuid(),
  bank_account_id: z.string().uuid(),
  statement_date: z.string().datetime(),
  statement_balance: z.number(),
  ledger_entries: z.array(z.object({
    id: z.string().uuid(),
    transaction_date: z.string().datetime(),
    description: z.string(),
    amount: z.number(),
    type: z.enum(['debit', 'credit']),
  })),
});
