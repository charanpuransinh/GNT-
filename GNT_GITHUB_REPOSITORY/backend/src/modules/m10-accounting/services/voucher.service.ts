import { PrismaClient } from '@prisma/client';

export class VoucherService {
  constructor(private prisma: PrismaClient) {}

  async createVoucher(data: any): Promise<any> {
    const { items, ...voucherData } = data;
    const totalDebit = items.reduce((sum: number, i: any) => sum + (i.debit_amount || 0), 0);
    const totalCredit = items.reduce((sum: number, i: any) => sum + (i.credit_amount || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Debit and credit totals must be equal');
    }

    return this.prisma.voucher.create({
      data: {
        ...voucherData,
        total_debit: totalDebit,
        total_credit: totalCredit,
        items: { create: items },
      },
      include: { items: true },
    });
  }

  async getVouchers(companyId: string, type?: string, fromDate?: Date, toDate?: Date): Promise<any[]> {
    return this.prisma.voucher.findMany({
      where: {
        company_id: companyId,
        ...(type ? { voucher_type: type } : {}),
        ...(fromDate && toDate ? { voucher_date: { gte: fromDate, lte: toDate } } : {}),
      },
      include: { items: true },
      orderBy: { voucher_date: 'desc' },
    });
  }

  async getVoucherById(id: string): Promise<any> {
    return this.prisma.voucher.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async cancelVoucher(id: string): Promise<any> {
    const voucher = await this.prisma.voucher.findUnique({ where: { id } });
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status === 'cancelled') throw new Error('Already cancelled');

    return this.prisma.voucher.update({
      where: { id },
      data: { status: 'cancelled', updated_at: new Date() },
    });
  }
}
