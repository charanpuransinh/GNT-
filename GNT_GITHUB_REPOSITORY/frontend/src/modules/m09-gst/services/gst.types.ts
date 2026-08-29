export interface TaxSlabDTO {
  id: string;
  company_id: string;
  name: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate?: number;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
}

export interface HSNDTO {
  id: string;
  company_id: string;
  hsn_code: string;
  description?: string;
  type: 'goods' | 'services';
  gst_rate?: number;
  cess_rate?: number;
}

export interface TaxItemDTO {
  hsn_code: string;
  taxable_amount: number;
  quantity?: number;
}

export interface TaxBreakupDTO {
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_tax_amount: number;
}

export interface GSTReturnDTO {
  section: string;
  invoice_count: number;
  taxable_value: number;
  tax_amount: number;
}

export interface GSTR3BDTO {
  outward_taxable_supplies: number;
  inward_taxable_supplies: number;
  ict_available: number;
  tax_payable: number;
}

export interface EInvoiceDTO {
  id: string;
  sales_invoice_id?: string;
  irn?: string;
  ack_no?: string;
  ack_date?: string;
  status: 'pending' | 'generated' | 'cancelled';
  qr_code?: string;
}
