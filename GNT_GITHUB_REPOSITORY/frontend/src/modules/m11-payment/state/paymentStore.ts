import { create } from 'zustand';
import { Payment, Invoice, Refund, BankAccount, PaymentMethod } from '../types';
import { paymentApi, invoiceApi, refundApi, bankApi, methodApi } from '../api/paymentApi';

interface PaymentState {
  payments: Payment[];
  invoices: Invoice[];
  refunds: Refund[];
  bankAccounts: BankAccount[];
  methods: PaymentMethod[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;

  fetchPayments: () => Promise<void>;
  fetchInvoices: () => Promise<void>;
  fetchRefunds: () => Promise<void>;
  fetchBankAccounts: () => Promise<void>;
  fetchMethods: () => Promise<void>;
  createPayment: (data: Partial<Payment>) => Promise<void>;
  createInvoice: (data: Partial<Invoice>) => Promise<void>;
  setSelectedInvoice: (invoice: Invoice | null) => void;
}

export const usePaymentStore = create<PaymentState>((set, get) => ({
  payments: [],
  invoices: [],
  refunds: [],
  bankAccounts: [],
  methods: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,

  fetchPayments: async () => {
    set({ isLoading: true });
    try {
      const res = await paymentApi.getPayments();
      if (res.data) set({ payments: res.data, error: null });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchInvoices: async () => {
    set({ isLoading: true });
    try {
      const res = await invoiceApi.getInvoices();
      if (res.data) set({ invoices: res.data, error: null });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchRefunds: async () => {
    set({ isLoading: true });
    try {
      const res = await refundApi.getRefunds();
      if (res.data) set({ refunds: res.data, error: null });
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchBankAccounts: async () => {
    try {
      const res = await bankApi.getAccounts();
      if (res.data) set({ bankAccounts: res.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  fetchMethods: async () => {
    try {
      const res = await methodApi.getMethods();
      if (res.data) set({ methods: res.data });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  createPayment: async (data) => {
    set({ isLoading: true });
    try {
      await paymentApi.createPayment(data);
      await get().fetchPayments();
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createInvoice: async (data) => {
    set({ isLoading: true });
    try {
      await invoiceApi.createInvoice(data);
      await get().fetchInvoices();
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  setSelectedInvoice: (invoice) => set({ selectedInvoice: invoice }),
}));
