export interface CreateTaxSlabDTO {
  company_id: string;
  name: string;
  cgst_rate: number;
  sgst_rate: number;
  igst_rate: number;
  cess_rate?: number;
  effective_from?: Date;
  effective_to?: Date;
}

export interface CreateHSNDTO {
  company_id: string;
  hsn_code: string;
  description?: string;
  type: 'goods' | 'services';
  gst_rate?: number;
  cess_rate?: number;
}

export interface CalculateTaxRequestDTO {
  items: Array<{
    hsn_code: string;
    taxable_amount: number;
    quantity?: number;
  }>;
  state_code: string;
  company_state_code: string;
  company_id: string;
}

export interface TaxBreakupResponseDTO {
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  cess_amount: number;
  total_tax_amount: number;
}

export interface GSTR1ResponseDTO {
  section: string;
  invoice_count: number;
  taxable_value: number;
  tax_amount: number;
}

export interface GSTR3BResponseDTO {
  outward_taxable_supplies: number;
  inward_taxable_supplies: number;
  ict_available: number;
  tax_payable: number;
}

export interface EInvoiceResponseDTO {
  id: string;
  sales_invoice_id?: string;
  irn?: string;
  ack_no?: string;
  ack_date?: Date;
  qr_code?: string;
  status: string;
}

export interface EWayBillResponseDTO {
  id: string;
  sales_invoice_id?: string;
  ewb_no?: string;
  ewb_date?: Date;
  valid_upto?: Date;
  distance_km?: number;
  vehicle_no?: string;
  status: string;
}

export interface ReconcileGSTR2BRequestDTO {
  company_id: string;
  purchase_data: Array<{
    invoice_no: string;
    gstin: string;
    tax_amount: number;
  }>;
}

export interface ReconcileGSTR2BResponseDTO {
  invoice_no: string;
  matched: boolean;
  difference: number;
}
