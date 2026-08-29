// M11 Payment Module - Reconciliation Repository

import { PrismaClient, Prisma, Reconciliation, ReconciliationItem } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateReconciliationDto, UpdateReconciliationItemDto } from '../types';

export class ReconciliationRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, tenantId: string) {
    return this.prisma.reconciliation.findFirst({
      where: { id, tenantId },
      include: { items: true, bankAccount: true },
    });
  }

  async findAll(tenantId: string, bankAccountId?: string) {
    const where: Prisma.ReconciliationWhereInput = { tenantId };
    if (bankAccountId) where.bankAccountId = bankAccountId;

    return this.prisma.reconciliation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { bankAccount: { select: { accountName: true, accountNumber: true } } },
    });
  }

  async create(dto: CreateReconciliationDto, tenantId: string, userId: string) {
    return this.prisma.reconciliation.create({
      data: {
        tenantId,
        bankAccountId: dto.bankAccountId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: 'PENDING',
        statementFileUrl: dto.statementFileUrl || null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: { items: true },
    });
  }

  async addItems(reconciliationId: string, items: { statementDate: Date; statementDesc: string; statementAmount: Decimal; statementType: string }[], tenantId: string, userId: string) {
    return this.prisma.reconciliationItem.createMany({
      data: items.map(item => ({
        tenantId,
        reconciliationId,
        statementDate: item.statementDate,
        statementDesc: item.statementDesc,
        statementAmount: item.statementAmount,
        statementType: item.statementType,
        isMatched: false,
        createdBy: userId,
        updatedBy: userId,
      })),
    });
  }

  async updateItem(id: string, dto: UpdateReconciliationItemDto, tenantId: string, userId: string) {
    return this.prisma.reconciliationItem.update({
      where: { id },
      data: {
        transactionId: dto.transactionId || undefined,
        isMatched: dto.isMatched ?? undefined,
        matchConfidence: dto.matchConfidence ? new Decimal(dto.matchConfidence) : undefined,
        varianceAmount: dto.varianceAmount ? new Decimal(dto.varianceAmount) : undefined,
        resolutionNotes: dto.resolutionNotes || undefined,
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedBy: userId,
      },
    });
  }

  async updateStatus(id: string, status: string, tenantId: string, userId: string) {
    return this.prisma.reconciliation.update({
      where: { id },
      data: { status, updatedBy: userId },
    });
  }
}
