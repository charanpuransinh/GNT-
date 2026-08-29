import { useEffect } from 'react';
import { usePaymentStore } from '../store/paymentStore';

export const usePayments = () => {
  const store = usePaymentStore();
  useEffect(() => { store.fetchPayments(); }, []);
  return {
    payments: store.payments,
    isLoading: store.isLoading,
    error: store.error,
    createPayment: store.createPayment,
  };
};

export const useInvoices = () => {
  const store = usePaymentStore();
  useEffect(() => { store.fetchInvoices(); }, []);
  return {
    invoices: store.invoices,
    isLoading: store.isLoading,
    error: store.error,
    selectedInvoice: store.selectedInvoice,
    setSelectedInvoice: store.setSelectedInvoice,
    createInvoice: store.createInvoice,
  };
};
