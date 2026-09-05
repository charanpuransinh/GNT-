import { Prisma, PrismaClient } from '@prisma/client';

export class EInvoiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ⚠️ पहले company_id की जाँच यहाँ थी ही नहीं — invoiceId सिर्फ़ पता होने भर से
  // कोई भी company दूसरी company के असली sales invoice पर सरकारी e-invoice (IRN)
  // या e-way bill बनवा सकती थी। यह सिर्फ़ डेटा-लीक नहीं — IRP (सरकारी पोर्टल) को
  // असली submission जाती है, ग़लत company के नाम पर। अब company_id अनिवार्य है।
  /** Reads the authoritative M08 sales invoice from the shared PostgreSQL schema. */
  async getInvoiceData(invoiceId: string, companyId: string): Promise<any | null> {
    const rows = await this.prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT
        si.id,
        si.company_id,
        si.branch_id,
        si.customer_id,
        si.invoice_number,
        si.invoice_date,
        si.due_date,
        si.total_amount,
        si.total_tax,
        si.total_discount,
        si.net_amount,
        si.round_off,
        si.grand_total,
        si.payment_status,
        COALESCE((
          SELECT json_agg(json_build_object(
            'id', sii.id,
            'product_id', sii.product_id,
            'batch_id', sii.batch_id,
            'quantity', sii.quantity,
            'rate', sii.rate,
            'discount_percent', sii.discount_percent,
            'discount_amount', sii.discount_amount,
            'amount', sii.amount,
            'tax_rate', sii.tax_rate,
            'tax_amount', sii.tax_amount,
            'net_amount', sii.net_amount,
            'hsn_code', sii.hsn_code
          ) ORDER BY sii.id)
          FROM sales_invoice_item sii
          WHERE sii.sales_invoice_id = si.id
        ), '[]'::json) AS items
      FROM sales_invoice si
      WHERE si.id = ${invoiceId} AND si.company_id = ${companyId}
      LIMIT 1
    `);
    return rows[0] ?? null;
  }

  // `data: any` था — कोई भी field नाम ग़लत लिखा जाता तो tsc चुप रहता और
  // गड़बड़ी असली e-invoice बनाते वक़्त, IRP से जवाब आने के बाद दिखती।
  async createEInvoice(data: Prisma.e_invoice_recordUncheckedCreateInput): Promise<any> {
    return this.prisma.e_invoice_record.create({ data });
  }

  async findByIRN(irn: string, companyId: string): Promise<any> {
    return this.prisma.e_invoice_record.findFirst({ where: { irn, company_id: companyId } });
  }

  async updateEInvoiceStatus(irn: string, companyId: string, status: string): Promise<any> {
    const { count } = await this.prisma.e_invoice_record.updateMany({
      where: { irn, company_id: companyId },
      data: { status, updated_at: new Date() },
    });
    if (count === 0) throw new Error('E-Invoice not found for this company');
    return this.findByIRN(irn, companyId);
  }

  async createEWayBill(data: Prisma.e_way_bill_recordUncheckedCreateInput): Promise<any> {
    return this.prisma.e_way_bill_record.create({ data });
  }

  async findEWayBillByNo(ewbNo: string, companyId: string): Promise<any> {
    return this.prisma.e_way_bill_record.findFirst({ where: { ewb_no: ewbNo, company_id: companyId } });
  }
}
