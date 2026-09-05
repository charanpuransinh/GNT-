import { EInvoiceRepository } from '../repositories/einvoice.repository';

export interface TransportDetails {
  distance_km: number;
  vehicle_no?: string;
  transporter_id?: string;
  transporter_name?: string;
}

export interface IRPGenerateResult {
  irn: string;
  ack_no: string;
  ack_date: Date;
  signed_invoice: string;
  qr_code: string;
}

export interface IRPProvider {
  generateEInvoice(invoice: any): Promise<IRPGenerateResult>;
  cancelEInvoice(irn: string, reason: string): Promise<void>;
  generateEWayBill(invoice: any, transport: TransportDetails): Promise<{
    ewb_no: string;
    ewb_date: Date;
    valid_upto: Date;
  }>;
}

/**
 * M18/IRP is an external boundary. M09 must never manufacture IRNs, ACKs,
 * signed payloads or E-Way Bill numbers locally.
 */
export class EInvoiceService {
  constructor(
    private readonly repo: EInvoiceRepository,
    private readonly irp: IRPProvider,
  ) {}

  // पहले companyId कहीं नहीं लिया जाता था — invoiceId/irn सिर्फ़ पता होने भर से
  // कोई भी company दूसरी company के sales invoice पर असली सरकारी e-invoice/
  // e-way bill बनवा या cancel कर सकती थी।
  async generateIRN(invoiceId: string, companyId: string): Promise<any> {
    const invoice = await this.repo.getInvoiceData(invoiceId, companyId);
    if (!invoice) throw new Error('Sales invoice not found');
    if (!Array.isArray(invoice.items) || invoice.items.length === 0) throw new Error('Sales invoice has no items');

    const result = await this.irp.generateEInvoice(invoice);
    if (!result.irn || !result.ack_no || !result.signed_invoice || !result.qr_code) {
      throw new Error('IRP returned an incomplete E-Invoice response');
    }

    return this.repo.createEInvoice({
      company_id: invoice.company_id,
      sales_invoice_id: invoiceId,
      irn: result.irn,
      ack_no: result.ack_no,
      ack_date: result.ack_date,
      signed_invoice: result.signed_invoice,
      qr_code: result.qr_code,
      status: 'generated',
    });
  }

  async cancelIRN(irn: string, reason: string, companyId: string): Promise<any> {
    if (!reason?.trim()) throw new Error('Cancellation reason is required');
    const existing = await this.repo.findByIRN(irn, companyId);
    if (!existing) throw new Error('IRN not found');
    if (existing.status === 'cancelled') throw new Error('Already cancelled');
    await this.irp.cancelEInvoice(irn, reason);
    return this.repo.updateEInvoiceStatus(irn, companyId, 'cancelled');
  }

  async getStatus(irn: string, companyId: string): Promise<any> {
    return this.repo.findByIRN(irn, companyId);
  }

  async generateEWayBill(invoiceId: string, transport: TransportDetails, companyId: string): Promise<any> {
    if (!Number.isFinite(transport?.distance_km) || transport.distance_km <= 0) {
      throw new Error('A positive transport distance is required');
    }
    const invoice = await this.repo.getInvoiceData(invoiceId, companyId);
    if (!invoice) throw new Error('Sales invoice not found');
    const result = await this.irp.generateEWayBill(invoice, transport);
    if (!result.ewb_no || !result.ewb_date || !result.valid_upto) {
      throw new Error('IRP returned an incomplete E-Way Bill response');
    }

    return this.repo.createEWayBill({
      company_id: invoice.company_id,
      sales_invoice_id: invoiceId,
      ewb_no: result.ewb_no,
      ewb_date: result.ewb_date,
      valid_upto: result.valid_upto,
      distance_km: transport.distance_km,
      vehicle_no: transport.vehicle_no,
      status: 'generated',
    });
  }
}
