import { apiClient } from '@/core/api-client';
import { TaxBreakupDTO, TaxItemDTO, TaxSlabDTO, GSTReturnDTO, GSTR3BDTO, EInvoiceDTO, HSNDTO } from './gst.types';

// पहले raw fetch() था — कोई Authorization header ही नहीं जाता था (apiClient
// जोड़ता है), हर call backend से 401 पाती। नोट: M09 के backend endpoints raw
// JSON लौटाते हैं ({success,data} envelope में नहीं) — इसलिए यहाँ `r.data` ही
// असली body है, `r.data.data` नहीं (बाक़ी modules से अलग, backend कोड में जाँचा)।
const API_BASE = '/api/v1/gst';

export const GSTService = {
  async createTaxSlab(data: Partial<TaxSlabDTO>): Promise<TaxSlabDTO> {
    const r = await apiClient.post<TaxSlabDTO>(`${API_BASE}/tax-slabs`, data);
    return r.data;
  },

  async getTaxSlabs(companyId: string): Promise<TaxSlabDTO[]> {
    const r = await apiClient.get<TaxSlabDTO[]>(`${API_BASE}/tax-slabs`, { params: { company_id: companyId } });
    return r.data;
  },

  async calculateTax(items: TaxItemDTO[], stateCode: string, companyStateCode: string, companyId: string): Promise<TaxBreakupDTO> {
    const r = await apiClient.post<TaxBreakupDTO>(`${API_BASE}/calculate`, {
      items, state_code: stateCode, company_state_code: companyStateCode, company_id: companyId,
    });
    return r.data;
  },

  async getGSTR1(companyId: string, period: string): Promise<GSTReturnDTO[]> {
    const r = await apiClient.get<GSTReturnDTO[]>(`${API_BASE}/returns/gstr1`, { params: { company_id: companyId, period } });
    return r.data;
  },

  async getGSTR3B(companyId: string, period: string): Promise<GSTR3BDTO> {
    const r = await apiClient.get<GSTR3BDTO>(`${API_BASE}/returns/gstr3b`, { params: { company_id: companyId, period } });
    return r.data;
  },

  async generateEInvoice(invoiceId: string): Promise<EInvoiceDTO> {
    const r = await apiClient.post<EInvoiceDTO>(`${API_BASE}/einvoice/generate`, { invoice_id: invoiceId });
    return r.data;
  },

  async reconcileGSTR2B(companyId: string, purchaseData: any[]): Promise<any[]> {
    const r = await apiClient.post<any[]>(`${API_BASE}/reconcile/gstr2b`, { company_id: companyId, purchase_data: purchaseData });
    return r.data;
  },
};
