import { apiClient } from '@/core/api-client';
import { AccountDTO, VoucherDTO, LedgerEntryDTO, TrialBalanceDTO, ProfitLossDTO, BalanceSheetDTO, BRSDTO } from './accounting.types';

// पहले raw fetch() था — कोई Authorization header नहीं जाता था (apiClient जोड़ता
// है), हर call 401. backend यहाँ raw JSON लौटाता है ({success,data} envelope
// में नहीं) — इसलिए `r.data` ही असली body है (backend कोड में जाँचा)।
const API_BASE = '/api/v1/accounting';

export const AccountingService = {
  async createAccount(data: Partial<AccountDTO>): Promise<AccountDTO> {
    const r = await apiClient.post<AccountDTO>(`${API_BASE}/accounts`, data);
    return r.data;
  },

  async getAccounts(companyId: string, type?: string): Promise<AccountDTO[]> {
    const r = await apiClient.get<AccountDTO[]>(`${API_BASE}/accounts`, { params: { company_id: companyId, type } });
    return r.data;
  },

  async getLedger(accountId: string, fromDate?: string, toDate?: string): Promise<LedgerEntryDTO[]> {
    const r = await apiClient.get<LedgerEntryDTO[]>(`${API_BASE}/ledger`, { params: { account_id: accountId, from_date: fromDate, to_date: toDate } });
    return r.data;
  },

  async createVoucher(data: Partial<VoucherDTO>): Promise<VoucherDTO> {
    const r = await apiClient.post<VoucherDTO>(`${API_BASE}/vouchers`, data);
    return r.data;
  },

  async postVoucher(voucherId: string): Promise<void> {
    await apiClient.post(`${API_BASE}/vouchers/${voucherId}/post`);
  },

  async getTrialBalance(companyId: string, asOfDate?: string): Promise<TrialBalanceDTO[]> {
    const r = await apiClient.get<TrialBalanceDTO[]>(`${API_BASE}/trial-balance`, { params: { company_id: companyId, as_of_date: asOfDate } });
    return r.data;
  },

  async getProfitLoss(companyId: string, fromDate: string, toDate: string): Promise<ProfitLossDTO> {
    const r = await apiClient.get<ProfitLossDTO>(`${API_BASE}/profit-loss`, { params: { company_id: companyId, from_date: fromDate, to_date: toDate } });
    return r.data;
  },

  async getBalanceSheet(companyId: string, asOfDate: string): Promise<BalanceSheetDTO> {
    const r = await apiClient.get<BalanceSheetDTO>(`${API_BASE}/balance-sheet`, { params: { company_id: companyId, as_of_date: asOfDate } });
    return r.data;
  },
};
