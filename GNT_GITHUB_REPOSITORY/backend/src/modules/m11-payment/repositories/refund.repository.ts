// M11 Payment Module - Refund Repository
// (टास्क #025 B4: Refund model के असली fields — originalTxnId/refundNumber/providerRef)

import { PrismaClient, Prisma, Refund } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RefundFilter, CreateRefundDto, UpdateRefundDto, RefundStatus } from '../types';
import { toDecimal } from '../utils/decimal.helper';

export class RefundRepository {
  constructor(private prisma: PrismaClient) {}

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
        originalTxnId: dto.transactionId,
        amount: toDecimal(dto.amount),
        status: 'PENDING',
        reason: dto.reason,
      },
    });
  }

  async update(id: string, dto: UpdateRefundDto, _tenantId: string, _userId: string): Promise<Refund> {
    return this.prisma.refund.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status as RefundStatus } : {}),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
      },
    });
  }

  async approve(id: string, _tenantId: string, _approverId: string): Promise<Refund> {
    return this.prisma.refund.update({
      where: { id },
      data: { status: 'APPROVED', processedAt: new Date() },
    });
  }

  async reject(id: string, _tenantId: string, _userId: string, _reason?: string): Promise<Refund> {
    return this.prisma.refund.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async delete(id: string, _tenantId: string): Promise<Refund> {
    return this.prisma.refund.delete({ where: { id } });
  }
}
