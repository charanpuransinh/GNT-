// M11 Payment Module - Refund Repository

import { PrismaClient, Prisma, Refund, RefundStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RefundFilter, CreateRefundDto, UpdateRefundDto } from '../types';
import { toDecimal } from '../utils/decimal.helper';

export class RefundRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<Refund | null> {
    return this.prisma.refund.findFirst({
      where: { id, tenantId },
      include: { transaction: true },
    });
  }

  async findAll(filter: RefundFilter, tenantId: string) {
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', status, transactionId } = filter;

    const where: Prisma.RefundWhereInput = { tenantId };
    if (status) where.status = status;
    if (transactionId) where.transactionId = transactionId;

    const [data, total] = await Promise.all([
      this.prisma.refund.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { transaction: { select: { id: true, amount: true, status: true, payerName: true } } },
      }),
      this.prisma.refund.count({ where }),
    ]);

    return { data, total };
  }

  async create(dto: CreateRefundDto, tenantId: string, userId: string): Promise<Refund> {
    return this.prisma.refund.create({
      data: {
        tenantId,
        transactionId: dto.transactionId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'INR',
        status: 'REQUESTED',
        reason: dto.reason,
        reasonCode: dto.reasonCode || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdateRefundDto, tenantId: string, userId: string): Promise<Refund> {
    return this.prisma.refund.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async approve(id: string, tenantId: string, approverId: string): Promise<Refund> {
    return this.prisma.refund.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: approverId,
        approvedAt: new Date(),
        updatedBy: approverId,
      },
    });
  }

  async reject(id: string, tenantId: string, userId: string, reason?: string): Promise<Refund> {
    return this.prisma.refund.update({
      where: { id },
      data: {
        status: 'REJECTED',
        updatedBy: userId,
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<Refund> {
    return this.prisma.refund.delete({ where: { id } });
  }
}
