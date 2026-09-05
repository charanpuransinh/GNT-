// M11 Payment Module - Payment Transaction Service
// Business Logic Layer - Cross-module calls via PUBLIC API ONLY
// (invoice M07/M08 की चीज़ है — M11 उसे mutate नहीं करता; referenceId/referenceType सिर्फ़ link)

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentRepository } from '../repositories/payment.repository';
import { BankAccountRepository } from '../repositories/bankAccount.repository';
import { LedgerRepository } from '../repositories/ledger.repository';
import { PaymentMethodRepository } from '../repositories/paymentMethod.repository';
import { EventBus } from '../events/event.bus';
import {
  PaymentFilter, CreatePaymentDto, UpdatePaymentDto,
  PaymentCompletedEvent,
} from '../types';
import { AppError } from '@/common/errors/error-classes';
import { toDecimal, zeroDecimal } from '../utils/decimal.helper';

export class PaymentService {
  private paymentRepo: PaymentRepository;
  private bankRepo: BankAccountRepository;
  private ledgerRepo: LedgerRepository;
  private pmRepo: PaymentMethodRepository;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.paymentRepo = new PaymentRepository(prisma);
    this.bankRepo = new BankAccountRepository(prisma);
    this.ledgerRepo = new LedgerRepository(prisma);
    this.pmRepo = new PaymentMethodRepository(prisma);
    this.eventBus = eventBus;
  }

  // ==================== PUBLIC API: Get Payment ====================
  async getPayment(id: string, tenantId: string) {
    const payment = await this.paymentRepo.findById(id, tenantId);
    if (!payment) throw this.notFound('Payment not found');
    return payment;
  }

  // ==================== PUBLIC API: List Payments ====================
  async listPayments(filter: PaymentFilter, tenantId: string) {
    return this.paymentRepo.findAll(filter, tenantId);
  }

  // ==================== PUBLIC API: Create Payment ====================
  async createPayment(dto: CreatePaymentDto, tenantId: string, userId: string) {
    if (!tenantId) throw this.badRequest('Tenant is required');

    // Validate payment method
    const pm = await this.pmRepo.findById(dto.paymentMethodId, tenantId);
    if (!pm) throw this.badRequest('Invalid payment method');
    if (!pm.isActive) throw this.badRequest('Payment method is inactive');

    // Validate bank account if provided
    if (dto.bankAccountId) {
      const account = await this.bankRepo.findById(dto.bankAccountId, tenantId);
      if (!account) throw this.badRequest('Bank account not found');
    }

    // Create payment within transaction
    const payment = await this.prisma.$transaction(async (tx) => {
      const repo = new PaymentRepository(tx);
      return repo.create(dto, tenantId, userId);
    });

    // Publish event (async - fire and forget)
    this.eventBus.publish('payment.created', {
      transactionId: payment.id,
      tenantId,
      amount: payment.amount.toString(),
      currency: payment.currency,
      paymentMethodId: payment.paymentMethodId,
      invoiceId: payment.referenceId || undefined,
      payerId: payment.partyId || undefined,
      payerType: payment.partyType || undefined,
      timestamp: new Date(),
    });

    return payment;
  }

  // ==================== PUBLIC API: Process Payment ====================
  async processPayment(id: string, tenantId: string, userId: string, gatewayRef?: string, gatewayResponse?: Record<string, unknown>) {
    const payment = await this.paymentRepo.findById(id, tenantId);
    if (!payment) throw this.notFound('Payment not found');
    if (payment.status !== 'PENDING') throw this.badRequest('Payment is not pending');

    const amount = payment.amount;

    await this.prisma.$transaction(async (tx) => {
      const pRepo = new PaymentRepository(tx);
      const bRepo = new BankAccountRepository(tx);
      const lRepo = new LedgerRepository(tx);

      // Update payment status
      await pRepo.updateStatus(id, 'COMPLETED', tenantId, userId, gatewayRef, gatewayResponse);

      // Update bank account if linked
      if (payment.bankAccountId) {
        await bRepo.updateBalance(payment.bankAccountId, amount, tenantId, userId, true);
      }

      // Create ledger entries (M10 Finance integration)
      await lRepo.create([
        {
          transactionId: id,
          accountCode: 'CASH_BANK', // Asset account
          debitAmount: amount,
          creditAmount: zeroDecimal(),
          narration: `Payment received - ${payment.narration || id}`,
          entryDate: new Date(),
        },
        {
          transactionId: id,
          accountCode: 'SALES_REVENUE', // Revenue account
          debitAmount: zeroDecimal(),
          creditAmount: amount,
          narration: `Revenue recognized - ${payment.narration || id}`,
          entryDate: new Date(),
        },
      ], tenantId, userId);
    });

    // Publish completion event
    const event: PaymentCompletedEvent = {
      transactionId: id,
      tenantId,
      amount: amount.toString(),
      currency: payment.currency,
      paymentMethodId: payment.paymentMethodId,
      invoiceId: payment.referenceId || undefined,
      payerId: payment.partyId || undefined,
      payerType: payment.partyType || undefined,
      timestamp: new Date(),
    };

    this.eventBus.publish('payment.completed', event);
    this.eventBus.publish('invoice.payment_received', { // M08 notification (event-based, no direct DB)
      invoiceId: payment.referenceId,
      tenantId,
      amount: amount.toString(),
      transactionId: id,
    });

    return this.getPayment(id, tenantId);
  }

  // ==================== PUBLIC API: Fail Payment ====================
  async failPayment(id: string, tenantId: string, userId: string, reason: string) {
    const payment = await this.paymentRepo.findById(id, tenantId);
    if (!payment) throw this.notFound('Payment not found');

    const updated = await this.paymentRepo.updateStatus(id, 'FAILED', tenantId, userId, undefined, { failureReason: reason });

    this.eventBus.publish('payment.failed', {
      transactionId: id,
      tenantId,
      reason,
      timestamp: new Date(),
    });

    return updated;
  }

  // ==================== PUBLIC API: Cancel Payment ====================
  async cancelPayment(id: string, tenantId: string, userId: string) {
    const payment = await this.paymentRepo.findById(id, tenantId);
    if (!payment) throw this.notFound('Payment not found');
    if (payment.status === 'COMPLETED') throw this.badRequest('Cannot cancel completed payment');

    return this.paymentRepo.updateStatus(id, 'CANCELLED', tenantId, userId);
  }

  // ==================== PUBLIC API: Update Payment ====================
  async updatePayment(id: string, dto: UpdatePaymentDto, tenantId: string, userId: string) {
    const payment = await this.paymentRepo.findById(id, tenantId);
    if (!payment) throw this.notFound('Payment not found');
    return this.paymentRepo.update(id, dto, tenantId, userId);
  }

  // ==================== PUBLIC API: Delete Payment ====================
  async deletePayment(id: string, tenantId: string) {
    const payment = await this.paymentRepo.findById(id, tenantId);
    if (!payment) throw this.notFound('Payment not found');
    if (payment.status === 'COMPLETED') throw this.badRequest('Cannot delete completed payment');
    return this.paymentRepo.delete(id, tenantId);
  }

  // ==================== PUBLIC API: Dashboard Stats ====================
  async getDashboardStats(tenantId: string, startDate?: Date, endDate?: Date) {
    return this.paymentRepo.getDashboardStats(tenantId, startDate, endDate);
  }

  // ==================== PUBLIC API: Get Payment by Invoice ====================
  async getPaymentsByInvoice(invoiceId: string, tenantId: string) {
    return this.paymentRepo.findAll({ invoiceId, page: 1, limit: 100 }, tenantId);
  }

  // ==================== ERROR HELPERS ====================
  // (AppError फेंकना ज़रूरी है — app का global error-handler सिर्फ़ उसे पहचानता है;
  //  सादा object फेंकने पर ग्राहक को सही 404/400 की जगह 500 मिलता था)
  private notFound(message: string): AppError {
    return new AppError('NOT_FOUND', message, 404);
  }

  private badRequest(message: string): AppError {
    return new AppError('BAD_REQUEST', message, 400);
  }
}
