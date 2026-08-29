import { AccountDTO, VoucherDTO, LedgerEntryDTO, TrialBalanceDTO, ProfitLossDTO, BalanceSheetDTO, BRSDTO } from './accounting.types';

const API_BASE = '/api/v1/accounting';

export const AccountingService = {
  async createAccount(data: Partial<AccountDTO>): Promise<AccountDTO> {
    const res = await fetch(`${API_BASE}/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create account');
    return res.json();
  },

  async getAccounts(companyId: string, type?: string): Promise<AccountDTO[]> {
    const url = new URL(`${API_BASE}/accounts`, window.location.origin);
    url.searchParams.set('company_id', companyId);
    if (type) url.searchParams.set('type', type);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch accounts');
    return res.json();
  },

  async getLedger(accountId: string, fromDate?: string, toDate?: string): Promise<LedgerEntryDTO[]> {
    const url = new URL(`${API_BASE}/ledger`, window.location.origin);
    url.searchParams.set('account_id', accountId);
    if (fromDate) url.searchParams.set('from_date', fromDate);
    if (toDate) url.searchParams.set('to_date', toDate);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch ledger');
    return res.json();
  },

  async createVoucher(data: Partial<VoucherDTO>): Promise<VoucherDTO> {
    const res = await fetch(`${API_BASE}/vouchers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create voucher');
    return res.json();
  },

  async postVoucher(voucherId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/vouchers/${voucherId}/post`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to post voucher');
  },

  async getTrialBalance(companyId: string, asOfDate?: string): Promise<TrialBalanceDTO[]> {
    const url = new URL(`${API_BASE}/trial-balance`, window.location.origin);
    url.searchParams.set('company_id', companyId);
    if (asOfDate) url.searchParams.set('as_of_date', asOfDate);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch trial balance');
    return res.json();
  },

  async getProfitLoss(companyId: string, fromDate: string, toDate: string): Promise<ProfitLossDTO> {
    const res = await fetch(`${API_BASE}/profit-loss?company_id=${companyId}&from_date=${fromDate}&to_date=${toDate}`);
    if (!res.ok) throw new Error('Failed to fetch P&L');
    return res.json();
  },

  async getBalanceSheet(companyId: string, asOfDate: string): Promise<BalanceSheetDTO> {
    const res = await fetch(`${API_BASE}/balance-sheet?company_id=${companyId}&as_of_date=${asOfDate}`);
    if (!res.ok) throw new Error('Failed to fetch balance sheet');
    return res.json();
  },
};
