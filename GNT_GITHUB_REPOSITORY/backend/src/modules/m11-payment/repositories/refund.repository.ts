// M11 Payment Module - Refund Repository
// (टास्क #025 B4: Refund model के असली fields — originalTxnId/refundNumber/providerRef)
// (tenant-scope: हर write पर tenantId की बंदिश)

import { PrismaClient, Prisma, Refund } from '@prisma/client';
import { RefundFilter, CreateRefundDto, UpdateRefundDto } from '../types';
import { toDecimal } from '../utils/decimal.helper';

type Db = PrismaClient | Prisma.TransactionClient;

export class RefundRepository {
  constructor(private prisma: Db) {}

  async findById(id: string, tenantId: string): Promise<Refund | null> {
    return this.prisma.refund.findFirst({
      where: { id, tenantId },
      include: { originalTxn: true },
    });
  }

  async findAll(filter: RefundFilter, tenantId: string) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, transactionId } = filter;

    const where: Prisma.RefundWhereInput = { tenantId };
    if (status) where.status = status;
    if (transactionId) where.originalTxnId = transactionId;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { originalTxn: { select: { id: true, amount: true, status: true, partyName: true } } },
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { data, total };
  }

  async create(dto: CreateRefundDto, tenantId: string, _userId: string): Promise<Refund> {
    return this.prisma.refund.create({
      data: {
        tenantId,
        refundNumber: `REF-${Date.now()}`,
        originalTxnId: dto.transactionId,
        amount: toDecimal(dto.amount),
        status: 'PENDING',
        reason: dto.reason,
      },
    });
  }

  async update(id: string, dto: UpdateRefundDto, tenantId: string, _userId: string): Promise<Refund> {
    const result = await this.prisma.refund.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.gatewayRef !== undefined ? { providerRef: dto.gatewayRef } : {}),
      },
    });
    if (result.count === 0) throw new Error('Refund not found');
    const refund = await this.prisma.refund.findFirst({ where: { id, tenantId } });
    if (!refund) throw new Error('Refund not found');
    return refund;
  }

  async approve(id: string, tenantId: string, _approverId: string): Promise<Refund> {
    const result = await this.prisma.refund.updateMany({
      where: { id, tenantId },
      data: { status: 'APPROVED' },
    });
    if (result.count === 0) throw new Error('Refund not found');
    const refund = await this.prisma.refund.findFirst({ where: { id, tenantId } });
    if (!refund) throw new Error('Refund not found');
    return refund;
  }

  async reject(id: string, tenantId: string, _userId: string, _reason?: string): Promise<Refund> {
    const result = await this.prisma.refund.updateMany({
      where: { id, tenantId },
      data: { status: 'REJECTED' },
    });
    if (result.count === 0) throw new Error('Refund not found');
    const refund = await this.prisma.refund.findFirst({ where: { id, tenantId } });
    if (!refund) throw new Error('Refund not found');
    return refund;
  }

  async delete(id: string, tenantId: string): Promise<Refund> {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error('Refund not found');
    await this.prisma.refund.deleteMany({ where: { id, tenantId } });
    return existing;
  }
}
