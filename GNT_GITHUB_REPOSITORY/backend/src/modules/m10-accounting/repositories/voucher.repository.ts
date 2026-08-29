import { PrismaClient } from '@prisma/client';

export class VoucherRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<any> {
    return this.prisma.voucher.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findByCompany(companyId: string, filters?: any): Promise<any[]> {
    return this.prisma.voucher.findMany({
      where: { company_id: companyId, ...filters },
      include: { items: true },
      orderBy: { voucher_date: 'desc' },
    });
  }

  async findByNumber(voucherNumber: string): Promise<any> {
    return this.prisma.voucher.findUnique({
      where: { voucher_number: voucherNumber },
      include: { items: true },
    });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    return this.prisma.voucher.update({
      where: { id },
      data: { status, updated_at: new Date() },
    });
  }
}
