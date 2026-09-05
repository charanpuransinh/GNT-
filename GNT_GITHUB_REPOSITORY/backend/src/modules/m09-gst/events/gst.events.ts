export const GST_EVENTS = {
  EINVOICE_GENERATED: 'gst.einvoice.generated',
  RETURN_FILED: 'gst.return.filed',
} as const;

export interface EInvoiceGeneratedEvent {
  company_id: string;
  invoice_id: string;
  irn: string;
  ack_no: string;
  qr_code: string;
}

export interface ReturnFiledEvent {
  company_id: string;
  return_type: 'GSTR1' | 'GSTR3B';
  period: string;
  filing_date: string;
}
