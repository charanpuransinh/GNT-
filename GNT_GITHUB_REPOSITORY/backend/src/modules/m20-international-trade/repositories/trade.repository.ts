// GNT M20 — Trade Repository (OWNER ONLY for trade_job)
// Owner: D4-DELTA | Hard Boundary: NO direct access from other modules

import { PrismaClient, Prisma, trade_job, TradeType, TradeStatus } from '@prisma/client';

export interface TradeJobCreateInput {
  company_id: string;
  type: TradeType;
  reference_no: string;
  party_id: string;
  product_id: string;
  hsn_code: string;
  quantity: Prisma.Decimal;
  value_fob?: Prisma.Decimal;
  value_cif?: Prisma.Decimal;
  currency: string;
  fx_rate: Prisma.Decimal;
  status?: TradeStatus;
}

export interface TradeJobUpdateInput {
  quantity?: Prisma.Decimal;
  value_fob?: Prisma.Decimal;
  value_cif?: Prisma.Decimal;
  currency?: string;
  fx_rate?: Prisma.Decimal;
  customs_duty?: Prisma.Decimal;
  gst_amount?: Prisma.Decimal;
  status?: TradeStatus;
  completed_at?: Date | null;
}

export class TradeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: TradeJobCreateInput): Promise<trade_job> {
    return this.prisma.trade_job.create({ data });
  }

  async findById(id: string, companyId: string): Promise<trade_job | null> {
    return this.prisma.trade_job.findFirst({
      where: { id, company_id: companyId },
      include: { hsn: true, documents: true },
    });
  }

  async findByReferenceNo(referenceNo: string, companyId: string): Promise<trade_job | null> {
    return this.prisma.trade_job.findFirst({
      where: { reference_no: referenceNo, company_id: companyId },
    });
  }

  async findMany(
    companyId: string,
    filters: { type?: TradeType; status?: TradeStatus; page?: number; limit?: number } = {}
  ) {
    const { type, status, page = 1, limit = 20 } = filters;
    const where: Prisma.trade_jobWhereInput = { company_id: companyId };
    if (type) where.type = type;
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.trade_job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { hsn: true, documents: { take: 5, orderBy: { created_at: 'desc' } } },
      }),
      this.prisma.trade_job.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async update(id: string, companyId: string, data: TradeJobUpdateInput): Promise<trade_job> {
    return this.prisma.trade_job.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, companyId: string, status: TradeStatus): Promise<trade_job> {
    const updateData: Prisma.trade_jobUpdateInput = { status };
    if (status === 'completed') updateData.completed_at = new Date();
    return this.prisma.trade_job.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string, companyId: string): Promise<trade_job> {
    return this.prisma.trade_job.delete({ where: { id } });
  }

  async exists(referenceNo: string, companyId: string): Promise<boolean> {
    const count = await this.prisma.trade_job.count({
      where: { reference_no: referenceNo, company_id: companyId },
    });
    return count > 0;
  }
}
