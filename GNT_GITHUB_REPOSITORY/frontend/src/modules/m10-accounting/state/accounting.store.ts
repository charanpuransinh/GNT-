import { create } from 'zustand';
import { AccountDTO, VoucherDTO, LedgerEntryDTO, TrialBalanceDTO, BRSDTO } from '../services/accounting.types';

interface AccountingState {
  accounts: AccountDTO[];
  vouchers: VoucherDTO[];
  ledgers: LedgerEntryDTO[];
  trialBalance: TrialBalanceDTO[];
  selectedAccount: AccountDTO | null;
  brsData: BRSDTO[];
  loading: boolean;
  error: string | null;
  setAccounts: (accounts: AccountDTO[]) => void;
  setVouchers: (vouchers: VoucherDTO[]) => void;
  setLedgers: (ledgers: LedgerEntryDTO[]) => void;
  setTrialBalance: (tb: TrialBalanceDTO[]) => void;
  setSelectedAccount: (account: AccountDTO | null) => void;
  setBRSData: (data: BRSDTO[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAccountingStore = create<AccountingState>((set) => ({
  accounts: [],
  vouchers: [],
  ledgers: [],
  trialBalance: [],
  selectedAccount: null,
  brsData: [],
  loading: false,
  error: null,
  setAccounts: (accounts) => set({ accounts }),
  setVouchers: (vouchers) => set({ vouchers }),
  setLedgers: (ledgers) => set({ ledgers }),
  setTrialBalance: (trialBalance) => set({ trialBalance }),
  setSelectedAccount: (selectedAccount) => set({ selectedAccount }),
  setBRSData: (brsData) => set({ brsData }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
