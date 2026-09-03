// GNT M20 — Zustand Trade State
// Owner: D4-DELTA

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  TradeJob,
  PaginatedTradeJobs,
  HSNItem,
  FXRate,
  CustomsDutyBreakdown,
  TradeDocument,
} from '../services/internationalTrade.types';

interface TradeState {
  // Data
  tradeJobs: TradeJob[];
  selectedTradeJob: TradeJob | null;
  hsnResults: HSNItem[];
  selectedHSN: HSNItem | null;
  fxRates: FXRate[];
  customsBreakdown: CustomsDutyBreakdown | null;
  documents: TradeDocument[];
  selectedDocument: TradeDocument | null;

  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };

  // UI State
  isLoading: boolean;
  error: string | null;
  activeTab: 'exports' | 'imports' | 'hsn' | 'fx' | 'customs' | 'documents';

  // (actions TradeActions mein hain)
}

interface TradeActions {
  setTradeJobs: (jobs: TradeJob[], meta?: PaginatedTradeJobs['meta']) => void;
  setSelectedTradeJob: (job: TradeJob | null) => void;
  addTradeJob: (job: TradeJob) => void;
  updateTradeJob: (job: TradeJob) => void;
  removeTradeJob: (id: string) => void;

  setHSNResults: (results: HSNItem[]) => void;
  setSelectedHSN: (hsn: HSNItem | null) => void;

  setFXRates: (rates: FXRate[]) => void;

  setCustomsBreakdown: (breakdown: CustomsDutyBreakdown | null) => void;

  setDocuments: (docs: TradeDocument[]) => void;
  setSelectedDocument: (doc: TradeDocument | null) => void;
  addDocument: (doc: TradeDocument) => void;

  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: TradeState['activeTab']) => void;

  reset: () => void;
}

/** Poora store = data + actions. */
export type TradeStore = TradeState & TradeActions;

/** Sirf data wala hissa — bina type diye TS ise never[]/string maan leta tha. */
const initialState: TradeState = {
  tradeJobs: [],
  selectedTradeJob: null,
  hsnResults: [],
  selectedHSN: null,
  fxRates: [],
  customsBreakdown: null,
  documents: [],
  selectedDocument: null,
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  isLoading: false,
  error: null,
  activeTab: 'exports',
};

export const useTradeStore = create<TradeStore>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,

        setTradeJobs: (jobs, meta) =>
          set((state) => ({
            tradeJobs: jobs,
            pagination: meta ? { ...state.pagination, ...meta } : state.pagination,
          })),

        setSelectedTradeJob: (job) => set({ selectedTradeJob: job }),

        addTradeJob: (job) =>
          set((state) => ({
            tradeJobs: [job, ...state.tradeJobs],
          })),

        updateTradeJob: (job) =>
          set((state) => ({
            tradeJobs: state.tradeJobs.map((j) => (j.id === job.id ? job : j)),
          })),

        removeTradeJob: (id) =>
          set((state) => ({
            tradeJobs: state.tradeJobs.filter((j) => j.id !== id),
          })),

        setHSNResults: (results) => set({ hsnResults: results }),
        setSelectedHSN: (hsn) => set({ selectedHSN: hsn }),

        setFXRates: (rates) => set({ fxRates: rates }),

        setCustomsBreakdown: (breakdown) => set({ customsBreakdown: breakdown }),

        setDocuments: (docs) => set({ documents: docs }),
        setSelectedDocument: (doc) => set({ selectedDocument: doc }),
        addDocument: (doc) =>
          set((state) => ({
            documents: [doc, ...state.documents],
          })),

        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        setActiveTab: (tab) => set({ activeTab: tab }),

        reset: () => set(initialState),
      }),
      {
        name: 'm20-trade-store',
        partialize: (state) => ({
          activeTab: state.activeTab,
          selectedHSN: state.selectedHSN,
        }),
      }
    ),
    { name: 'M20TradeStore' }
  )
);
