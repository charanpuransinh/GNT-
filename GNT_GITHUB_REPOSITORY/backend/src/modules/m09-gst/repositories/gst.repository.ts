import { PrismaClient } from '@prisma/client';

export class GSTRepository {
  constructor(private prisma: PrismaClient) {}

  async getTaxSlabsAsMap(companyId: string): Promise<Record<string, any>> {
    const slabs = await this.prisma.tax_rate_master.findMany({
      where: { company_id: companyId, is_active: true },
    });
    const map: Record<string, any> = {};
    for (const s of slabs) {
      map[s.name || 'default'] = {
        cgst_rate: Number(s.cgst_rate),
        sgst_rate: Number(s.sgst_rate),
        igst_rate: Number(s.igst_rate),
        cess_rate: Number(s.cess_rate),
      };
    }
    return map;
  }

  async getCompanyTurnoverCr(companyId: string): Promise<number> {
    return 0;
  }

  async compileGSTR1(companyId: string, period: string): Promise<any[]> {
    const start = new Date(period + '-01');
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const rows = await this.prisma.gst_transaction.groupBy({
      by: ['reference_type'],
      where: {
        company_id: companyId,
        transaction_date: { gte: start, lte: end },
        tax_type: 'output',
      },
      _sum: {
        taxable_amount: true,
        total_tax_amount: true,
      },
      _count: { id: true },
    });
    return rows.map((r) => ({
      section: r.reference_type,
      invoice_count: r._count.id,
      taxable_value: Number(r._sum.taxable_amount || 0),
      tax_amount: Number(r._sum.total_tax_amount || 0),
    }));
  }

  async compileGSTR3B(companyId: string, period: string): Promise<any> {
    const start = new Date(period + '-01');
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const [outward, inward] = await Promise.all([
      this.prisma.gst_transaction.aggregate({
        where: { company_id: companyId, transaction_date: { gte: start, lte: end }, tax_type: 'output' },
        _sum: { taxable_amount: true, total_tax_amount: true },
      }),
      this.prisma.gst_transaction.aggregate({
        where: { company_id: companyId, transaction_date: { gte: start, lte: end }, tax_type: 'input' },
        _sum: { taxable_amount: true, total_tax_amount: true },
      }),
    ]);
    const ict = Number(inward._sum.total_tax_amount || 0);
    const outTax = Number(outward._sum.total_tax_amount || 0);
    return {
      outward_taxable_supplies: Number(outward._sum.taxable_amount || 0),
      inward_taxable_supplies: Number(inward._sum.taxable_amount || 0),
      ict_available: ict,
      tax_payable: Math.max(0, outTax - ict),
    };
  }

  async reconcileAgainstGSTR2B(
    companyId: string,
    purchaseData: Array<{ invoice_no: string; gstin: string; tax_amount: number }>
  ): Promise<any[]> {
    const gstRecords = await this.prisma.gst_transaction.findMany({
      where: { company_id: companyId, tax_type: 'input' },
      select: { gstin: true, total_tax_amount: true, reference_id: true },
    });
    return purchaseData.map((p) => {
      const match = gstRecords.find(
        (g) => g.gstin === p.gstin && Math.abs(Number(g.total_tax_amount) - p.tax_amount) < 1
      );
      return {
        invoice_no: p.invoice_no,
        matched: !!match,
        difference: match ? 0 : p.tax_amount,
      };
    });
  }
}
