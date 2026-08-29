import { create } from 'zustand';
import { TaxSlabDTO, HSNDTO, GSTReturnDTO, EInvoiceDTO } from '../services/gst.types';

interface GSTState {
  taxSlabs: TaxSlabDTO[];
  hsnCodes: HSNDTO[];
  returns: GSTReturnDTO[];
  selectedReturn: string | null;
  eInvoices: EInvoiceDTO[];
  loading: boolean;
  error: string | null;
  setTaxSlabs: (slabs: TaxSlabDTO[]) => void;
  setHSNCodes: (codes: HSNDTO[]) => void;
  setReturns: (returns: GSTReturnDTO[]) => void;
  setSelectedReturn: (period: string | null) => void;
  setEInvoices: (invoices: EInvoiceDTO[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useGSTStore = create<GSTState>((set) => ({
  taxSlabs: [],
  hsnCodes: [],
  returns: [],
  selectedReturn: null,
  eInvoices: [],
  loading: false,
  error: null,
  setTaxSlabs: (taxSlabs) => set({ taxSlabs }),
  setHSNCodes: (hsnCodes) => set({ hsnCodes }),
  setReturns: (returns) => set({ returns }),
  setSelectedReturn: (selectedReturn) => set({ selectedReturn }),
  setEInvoices: (eInvoices) => set({ eInvoices }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
