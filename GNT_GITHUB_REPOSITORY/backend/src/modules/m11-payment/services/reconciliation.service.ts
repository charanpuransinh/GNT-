// M11 Payment Module - Reconciliation Service

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { ReconciliationRepository } from '../repositories/reconciliation.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BankAccountRepository } from '../repositories/bankAccount.repository';
import { EventBus } from '../events/event.bus';
import { CreateReconciliationDto, UpdateReconciliationItemDto, ApiError } from '../types';

export class ReconciliationService {
  private repo: ReconciliationRepository;
  private paymentRepo: PaymentRepository;
  private bankRepo: BankAccountRepository;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.repo = new ReconciliationRepository(prisma);
    this.paymentRepo = new PaymentRepository(prisma);
    this.bankRepo = new BankAccountRepository(prisma);
    this.eventBus = eventBus;
  }

  async getReconciliation(id: string, tenantId: string) {
    const recon = await this.repo.findById(id, tenantId);
    if (!recon) throw this.notFound('Reconciliation not found');
    return recon;
  }

  async listReconciliations(tenantId: string, bankAccountId?: string) {
    return this.repo.findAll(tenantId, bankAccountId);
  }

  async createReconciliation(dto: CreateReconciliationDto, tenantId: string, userId: string) {
    const account = await this.bankRepo.findById(dto.bankAccountId, tenantId);
    if (!account) throw this.badRequest('Bank account not found');

    const recon = await this.prisma.$transaction(async (tx) => {
      const rRepo = new ReconciliationRepository(tx as any);
      return rRepo.create(dto, tenantId, userId);
    });

    this.eventBus.publish('reconciliation.created', {
      reconciliationId: recon.id,
      tenantId,
      bankAccountId: dto.bankAccountId,
      timestamp: new Date(),
    });

    return this.getReconciliation(recon.id, tenantId);
  }

  async uploadStatement(id: string, statementData: any[], tenantId: string, userId: string) {
    const recon = await this.repo.findById(id, tenantId);
    if (!recon) throw this.notFound('Reconciliation not found');

    const items = statementData.map(row => ({
      statementDate: new Date(row.date),
      statementDesc: row.description,
      statementAmount: new Decimal(row.amount),
      statementType: row.type.toUpperCase(),
    }));

    await this.repo.addItems(id, items, tenantId, userId);

    // Calculate statement totals
    const statementCredits = items
      .filter(i => i.statementType === 'CREDIT')
      .reduce((sum, i) => sum.add(i.statementAmount), new Decimal(0));
    const statementDebits = items
      .filter(i => i.statementType === 'DEBIT')
      .reduce((sum, i) => sum.add(i.statementAmount), new Decimal(0));

    await this.prisma.paymentReconciliation.update({
      where: { id },
      data: {
        closingBalance: statementCredits.sub(statementDebits),
      },
    });

    return this.getReconciliation(id, tenantId);
  }

  async autoMatch(id: string, tenantId: string, userId: string) {
    const recon = await this.repo.findById(id, tenantId);
    if (!recon) throw this.notFound('Reconciliation not found');

    const { data: transactions } = await this.paymentRepo.findAll({
      page: 1,
      limit: 1000,
      startDate: recon.statementDate,
      endDate: recon.statementDate,
    }, tenantId);

    let matchedCount = 0;
    for (const item of recon.items) {
      if (item.isMatched) continue;

      const match = transactions.find(t => {
        const txAmount = t.amount as Decimal;
        const stmtAmount = item.statementAmount as Decimal;
        const sameAmount = txAmount.equals(stmtAmount);
        const sameDate = Math.abs(new Date(t.createdAt).getTime() - new Date(item.statementDate).getTime()) < 86400000; // 1 day
        return sameAmount && sameDate && t.status === 'COMPLETED';
      });

      if (match) {
        await this.repo.updateItem(item.id, {
          transactionId: match.id,
          isMatched: true,
          matchConfidence: '0.95',
          varianceAmount: '0',
        }, tenantId, userId);
        matchedCount++;
      }
    }

    // Update reconciliation status
    const totalItems = recon.items.length;
    const matchedItems = recon.items.filter(i => i.isMatched).length + matchedCount;
    const status = matchedItems === totalItems ? 'MATCHED' : matchedItems > 0 ? 'PARTIAL_MATCH' : 'UNMATCHED';

    await this.repo.updateStatus(id, status, tenantId, userId);

    return { matchedCount, totalItems, status };
  }

  async resolveItem(id: string, dto: UpdateReconciliationItemDto, tenantId: string, userId: string) {
    return this.repo.updateItem(id, dto, tenantId, userId);
  }

  // ==================== ERROR HELPERS ====================
  private notFound(message: string): ApiError {
    return { code: 'NOT_FOUND', message };
  }

  private badRequest(message: string): ApiError {
    return { code: 'BAD_REQUEST', message };
  }
}
