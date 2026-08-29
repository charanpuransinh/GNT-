import { IRPGenerateResult, IRPProvider, TransportDetails } from './einvoice.service';

export class HttpIRPProvider implements IRPProvider {
  constructor(
    private readonly baseUrl = process.env.GNT_IRP_BASE_URL,
    private readonly token = process.env.GNT_IRP_TOKEN,
  ) {}

  private async post(path: string, body: unknown): Promise<any> {
    if (!this.baseUrl || !this.token) throw new Error('IRP integration is not configured');
    const response = await fetch(new URL(path, this.baseUrl).toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${this.token}` },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    let data: any;
    try { data = text ? JSON.parse(text) : {}; } catch { throw new Error(`IRP returned non-JSON response (${response.status})`); }
    if (!response.ok) throw new Error(`IRP request failed (${response.status}): ${data?.message || 'unknown error'}`);
    return data;
  }

  async generateEInvoice(invoice: any): Promise<IRPGenerateResult> {
    const data = await this.post(process.env.GNT_IRP_EINVOICE_PATH || '/einvoice/generate', { invoice });
    return {
      irn: String(data.irn || ''),
      ack_no: String(data.ack_no || ''),
      ack_date: new Date(data.ack_date),
      signed_invoice: String(data.signed_invoice || ''),
      qr_code: String(data.qr_code || ''),
    };
  }

  async cancelEInvoice(irn: string, reason: string): Promise<void> {
    await this.post(process.env.GNT_IRP_CANCEL_PATH || '/einvoice/cancel', { irn, reason });
  }

  async generateEWayBill(invoice: any, transport: TransportDetails) {
    const data = await this.post(process.env.GNT_IRP_EWAYBILL_PATH || '/ewaybill/generate', { invoice, transport });
    return {
      ewb_no: String(data.ewb_no || ''),
      ewb_date: new Date(data.ewb_date),
      valid_upto: new Date(data.valid_upto),
    };
  }
}
