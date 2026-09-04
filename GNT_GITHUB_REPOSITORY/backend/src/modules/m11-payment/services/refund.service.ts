// M11 Payment Module - Refund Service
// Lifecycle: PENDING → APPROVED → PROCESSED (या PENDING → REJECTED)

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { RefundRepository } from '../repositories/refund.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { BankAccountRepository } from '../repositories/bankAccount.repository';
import { EventBus } from '../events/event.bus';
import { RefundFilter, CreateRefundDto, UpdateRefundDto, ApiError } from '../types';

export class RefundService {
  private refundRepo: RefundRepository;
  private paymentRepo: PaymentRepository;
  private bankRepo: BankAccountRepository;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.refundRepo = new RefundRepository(prisma);
    this.paymentRepo = new PaymentRepository(prisma);
    this.bankRepo = new BankAccountRepository(prisma);
    this.eventBus = eventBus;
  }

  async getRefund(id: string, tenantId: string) {
    const refund = await this.refundRepo.findById(id, tenantId);
    if (!refund) throw this.notFound('Refund not found');
    return refund;
  }

  async listRefunds(filter: RefundFilter, tenantId: string) {
    return this.refundRepo.findAll(filter, tenantId);
  }

  async createRefund(dto: CreateRefundDto, tenantId: string, userId: string) {
    const payment = await this.paymentRepo.findById(dto.transactionId, tenantId);
    if (!payment) throw this.badRequest('Transaction not found');
    if (payment.status !== 'COMPLETED') throw this.badRequest('Only completed payments can be refunded');

    const refundAmount = new Decimal(dto.amount);
    const paymentAmount = payment.amount;

    // Check if refund amount exceeds payment
    const existingRefunds = await this.refundRepo.findAll(
      { transactionId: dto.transactionId, status: 'PROCESSED', page: 1, limit: 100 },
      tenantId
    );
    const totalRefunded = existingRefunds.data.reduce((sum, r) => sum.add(r.amount), new Decimal(0));

    if (totalRefunded.add(refundAmount).gt(paymentAmount)) {
      throw this.badRequest('Refund amount exceeds payment amount');
    }

    const refund = await this.refundRepo.create(dto, tenantId, userId);

    this.eventBus.publish('refund.requested', {
      refundId: refund.id,
      tenantId,
      transactionId: dto.transactionId,
      amount: dto.amount,
      reason: dto.reason,
      timestamp: new Date(),
    });

    return refund;
  }

  async approveRefund(id: string, tenantId: string, approverId: string) {
    const refund = await this.refundRepo.findById(id, tenantId);
    if (!refund) throw this.notFound('Refund not found');
    if (refund.status !== 'PENDING') throw this.badRequest('Refund must be in pending status');

    await this.prisma.$transaction(async (tx) => {
      const rRepo = new RefundRepository(tx);
      const pRepo = new PaymentRepository(tx);
      const bRepo = new BankAccountRepository(tx);

      await rRepo.approve(id, tenantId, approverId);
      await rRepo.update(id, { status: 'PROCESSED' }, tenantId, approverId);

      // Update payment status
      const payment = await pRepo.findById(refund.originalTxnId, tenantId);
      if (payment) {
        const totalRefunded = refund.amount;
        const paymentAmount = payment.amount;
        const newStatus = totalRefunded.equals(paymentAmount) ? 'REFUNDED' : 'PARTIALLY_REFUNDED';
        await pRepo.updateStatus(payment.id, newStatus, tenantId, approverId);
      }

      // Deduct from bank account if linked
      if (payment?.bankAccountId) {
        await bRepo.updateBalance(payment.bankAccountId, refund.amount, tenantId, approverId, false);
      }
    });

    this.eventBus.publish('refund.completed', {
      refundId: id,
      tenantId,
      transactionId: refund.originalTxnId,
      amount: refund.amount.toString(),
      timestamp: new Date(),
    });

    return this.getRefund(id, tenantId);
  }

  async rejectRefund(id: string, tenantId: string, userId: string, reason?: string) {
    const refund = await this.refundRepo.findById(id, tenantId);
    if (!refund) throw this.notFound('Refund not found');
    if (refund.status !== 'PENDING') throw this.badRequest('Refund must be in pending status');

    const updated = await this.refundRepo.reject(id, tenantId, userId, reason);

    this.eventBus.publish('refund.rejected', {
      refundId: id,
      tenantId,
      transactionId: refund.originalTxnId,
      reason,
      timestamp: new Date(),
    });

    return updated;
  }

  async updateRefund(id: string, dto: UpdateRefundDto, tenantId: string, userId: string) {
    const refund = await this.refundRepo.findById(id, tenantId);
    if (!refund) throw this.notFound('Refund not found');
    return this.refundRepo.update(id, dto, tenantId, userId);
  }

  async deleteRefund(id: string, tenantId: string) {
    const refund = await this.refundRepo.findById(id, tenantId);
    if (!refund) throw this.notFound('Refund not found');
    if (refund.status === 'PROCESSED') throw this.badRequest('Cannot delete processed refund');
    return this.refundRepo.delete(id, tenantId);
  }

  // ==================== ERROR HELPERS ====================
  private notFound(message: string): ApiError {
    return { code: 'NOT_FOUND', message };
  }

  private badRequest(message: string): ApiError {
    return { code: 'BAD_REQUEST', message };
  }
}
