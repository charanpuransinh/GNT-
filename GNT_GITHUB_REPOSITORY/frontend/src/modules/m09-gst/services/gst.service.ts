import { TaxBreakupDTO, TaxItemDTO, TaxSlabDTO, GSTReturnDTO, GSTR3BDTO, EInvoiceDTO, HSNDTO } from './gst.types';

const API_BASE = '/api/v1/gst';

export const GSTService = {
  async createTaxSlab(data: Partial<TaxSlabDTO>): Promise<TaxSlabDTO> {
    const res = await fetch(`${API_BASE}/tax-slabs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create tax slab');
    return res.json();
  },

  async getTaxSlabs(companyId: string): Promise<TaxSlabDTO[]> {
    const res = await fetch(`${API_BASE}/tax-slabs?company_id=${companyId}`);
    if (!res.ok) throw new Error('Failed to fetch tax slabs');
    return res.json();
  },

  async calculateTax(items: TaxItemDTO[], stateCode: string, companyStateCode: string, companyId: string): Promise<TaxBreakupDTO> {
    const res = await fetch(`${API_BASE}/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, state_code: stateCode, company_state_code: companyStateCode, company_id: companyId }),
    });
    if (!res.ok) throw new Error('Tax calculation failed');
    return res.json();
  },

  async getGSTR1(companyId: string, period: string): Promise<GSTReturnDTO[]> {
    const res = await fetch(`${API_BASE}/returns/gstr1?company_id=${companyId}&period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch GSTR-1');
    return res.json();
  },

  async getGSTR3B(companyId: string, period: string): Promise<GSTR3BDTO> {
    const res = await fetch(`${API_BASE}/returns/gstr3b?company_id=${companyId}&period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch GSTR-3B');
    return res.json();
  },

  async generateEInvoice(invoiceId: string): Promise<EInvoiceDTO> {
    const res = await fetch(`${API_BASE}/einvoice/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoice_id: invoiceId }),
    });
    if (!res.ok) throw new Error('E-Invoice generation failed');
    return res.json();
  },

  async reconcileGSTR2B(companyId: string, purchaseData: any[]): Promise<any[]> {
    const res = await fetch(`${API_BASE}/reconcile/gstr2b`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, purchase_data: purchaseData }),
    });
    if (!res.ok) throw new Error('Reconciliation failed');
    return res.json();
  },
};
