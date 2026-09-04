// M11 Payment Module - Reconciliation Repository
// (tenant-scope: हर write पर tenantId की बंदिश)

import { PrismaClient, Prisma, PaymentReconciliation, PaymentReconciliationItem } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateReconciliationDto, UpdateReconciliationItemDto } from '../types';

type Db = PrismaClient | Prisma.TransactionClient;

export class ReconciliationRepository {
  constructor(private prisma: Db) {}

  async findById(id: string, tenantId: string) {
    return this.prisma.paymentReconciliation.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
  }

  async findAll(tenantId: string, bankAccountId?: string) {
    const where: Prisma.PaymentReconciliationWhereInput = { tenantId };
    if (bankAccountId) where.bankAccountId = bankAccountId;

    return this.prisma.paymentReconciliation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateReconciliationDto, tenantId: string, userId: string) {
    return this.prisma.paymentReconciliation.create({
      data: {
        tenantId,
        reconNumber: `REC-${Date.now()}`,
        bankAccountId: dto.bankAccountId,
        statementDate: dto.startDate,
        openingBalance: new Decimal(0),
        closingBalance: new Decimal(0),
        status: 'DRAFT',
        statementFileId: dto.statementFileUrl || null,
      },
      include: { items: true },
    });
  }

  async addItems(reconciliationId: string, items: { statementDate: Date; statementDesc: string; statementAmount: Decimal; statementType: string }[], tenantId: string, userId: string) {
    return this.prisma.paymentReconciliationItem.createMany({
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
    const result = await this.prisma.paymentReconciliationItem.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.transactionId !== undefined ? { transactionId: dto.transactionId } : {}),
        ...(dto.isMatched !== undefined ? { isMatched: dto.isMatched } : {}),
        ...(dto.matchConfidence ? { matchConfidence: new Decimal(dto.matchConfidence) } : {}),
        ...(dto.varianceAmount ? { varianceAmount: new Decimal(dto.varianceAmount) } : {}),
        ...(dto.resolutionNotes ? { resolutionNotes: dto.resolutionNotes } : {}),
        resolvedBy: userId,
        resolvedAt: new Date(),
        updatedBy: userId,
      },
    });
    if (result.count === 0) throw new Error('Reconciliation item not found');
    const item = await this.prisma.paymentReconciliationItem.findFirst({ where: { id, tenantId } });
    if (!item) throw new Error('Reconciliation item not found');
    return item;
  }

  async updateStatus(id: string, status: string, tenantId: string, userId: string) {
    const result = await this.prisma.paymentReconciliation.updateMany({
      where: { id, tenantId },
      data: { status },
    });
    if (result.count === 0) throw new Error('Reconciliation not found');
    const recon = await this.prisma.paymentReconciliation.findFirst({ where: { id, tenantId } });
    if (!recon) throw new Error('Reconciliation not found');
    return recon;
  }
}
