import { useGSTStore } from './gst.store';
import { GSTService } from '../services/gst.service';

export const GSTActions = {
  async fetchTaxSlabs(companyId: string) {
    const store = useGSTStore.getState();
    store.setLoading(true);
    try {
      const slabs = await GSTService.getTaxSlabs(companyId);
      store.setTaxSlabs(slabs);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  },

  async calculateTax(items: any[], stateCode: string, companyStateCode: string, companyId: string) {
    const store = useGSTStore.getState();
    store.setLoading(true);
    try {
      return await GSTService.calculateTax(items, stateCode, companyStateCode, companyId);
    } catch (e: any) {
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  },

  async generateGSTR1(companyId: string, period: string) {
    const store = useGSTStore.getState();
    store.setLoading(true);
    try {
      const data = await GSTService.getGSTR1(companyId, period);
      store.setReturns(data);
    } catch (e: any) {
      store.setError(e.message);
    } finally {
      store.setLoading(false);
    }
  },

  async generateEInvoice(invoiceId: string) {
    const store = useGSTStore.getState();
    store.setLoading(true);
    try {
      const invoice = await GSTService.generateEInvoice(invoiceId);
      store.setEInvoices([...useGSTStore.getState().eInvoices, invoice]);
      return invoice;
    } catch (e: any) {
      store.setError(e.message);
      throw e;
    } finally {
      store.setLoading(false);
    }
  },
};
