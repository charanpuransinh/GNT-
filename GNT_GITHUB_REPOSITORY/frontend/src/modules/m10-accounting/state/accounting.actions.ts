import { useAccountingStore } from './accounting.store';
import { AccountingService } from '../services/accounting.service';

export const AccountingActions = {
  async fetchAccounts(companyId: string, type?: string) {
    const store = useAccountingStore.getState();
    store.setLoading(true);
    try {
      const accounts = await AccountingService.getAccounts(companyId, type);
      store.setAccounts(accounts);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  },

  async fetchLedger(accountId: string, fromDate?: string, toDate?: string) {
    const store = useAccountingStore.getState();
    store.setLoading(true);
    try {
      const entries = await AccountingService.getLedger(accountId, fromDate, toDate);
      store.setLedgers(entries);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  },

  async postVoucher(voucherId: string) {
    const store = useAccountingStore.getState();
    store.setLoading(true);
    try {
      await AccountingService.postVoucher(voucherId);
      store.setLoading(false);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  },

  async generateTrialBalance(companyId: string, asOfDate?: string) {
    const store = useAccountingStore.getState();
    store.setLoading(true);
    try {
      const tb = await AccountingService.getTrialBalance(companyId, asOfDate);
      store.setTrialBalance(tb);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  },
};
