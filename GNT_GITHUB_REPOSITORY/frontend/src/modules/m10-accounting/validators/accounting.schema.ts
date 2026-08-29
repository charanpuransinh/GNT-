import { z } from 'zod';

export const frontendAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(255),
  code: z.string().min(1, 'Code is required').max(100),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  opening_balance: z.number().default(0),
});

export const frontendVoucherItemSchema = z.object({
  account_id: z.string().uuid('Select an account'),
  debit_amount: z.number().min(0),
  credit_amount: z.number().min(0),
});

export const frontendVoucherSchema = z.object({
  voucher_type: z.enum(['journal', 'cash_payment', 'cash_receipt', 'bank_payment', 'bank_receipt', 'contra']),
  voucher_number: z.string().min(1, 'Voucher number required'),
  voucher_date: z.string().min(1, 'Date required'),
  narration: z.string().optional(),
  items: z.array(frontendVoucherItemSchema).min(2, 'At least 2 entries required'),
}).refine((data) => {
  const td = data.items.reduce((s, i) => s + i.debit_amount, 0);
  const tc = data.items.reduce((s, i) => s + i.credit_amount, 0);
  return Math.abs(td - tc) < 0.01;
}, { message: 'Debit and credit must balance' });
