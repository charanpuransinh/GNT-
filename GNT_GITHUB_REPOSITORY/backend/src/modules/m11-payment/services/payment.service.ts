// M11 Payment Module - Payment Transaction Service
// Business Logic Layer - Cross-module calls via PUBLIC API ONLY
// (invoice M07/M08 की चीज़ है — M11 उसे mutate नहीं करता; referenceId/referenceType सिर्फ़ link)

import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentRepository } from '../repositories/payment.repository';
import { BankAccountRepository } from '../repositories/bankAccount.repository';
import { LedgerRepository } from '../repositories/ledger.repository';
import { PaymentMethodRepository } from '../repositories/paymentMethod.repository';
import { LedgerBridgeService, normalizePartyType, directionForPartyType } from './ledgerBridge.service';
import type { EventBus } from '@/common/events/event-bus';
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
  private ledgerBridge: LedgerBridgeService;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.paymentRepo = new PaymentRepository(prisma);
    this.bankRepo = new BankAccountRepository(prisma);
    this.ledgerRepo = new LedgerRepository(prisma);
    this.pmRepo = new PaymentMethodRepository(prisma);
    this.ledgerBridge = new LedgerBridgeService(prisma);
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

    // payerType कहीं से भी आए (frontend 'customer'/'supplier' भेजता है) — एक ही
    // सामान्य रूप, और M05 में असली party जाँच (सिर्फ़ CUSTOMER/VENDOR के लिए —
    // बिना जाँचे किसी भी id पर payment बन जाता था, मिटी/ग़लत party पर भी)
    const partyType = normalizePartyType(dto.payerType);
    if (dto.payerId) {
      await this.ledgerBridge.assertPartyExists(tenantId, partyType, dto.payerId);
    }
    const direction = directionForPartyType(partyType);

    // Create payment within transaction
    const payment = await this.prisma.$transaction(async (tx) => {
      const repo = new PaymentRepository(tx);
      return repo.create(dto, tenantId, userId, partyType, direction);
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
    // पहले यह हमेशा 'OUT' मानकर चलता था (create के hardcode की वजह से)। अब असली
    // direction — customer से receipt आया तो 'IN', वरना 'OUT'।
    const isReceipt = payment.direction === 'IN';

    // M10 में असली voucher — payment "COMPLETED" कहलाने से **पहले**। अगर यह फटा
    // (जैसे party/bank account resolve न हो पाए) तो payment PENDING ही रहता है,
    // "COMPLETED" दिखाकर किताबें ग़लत नहीं होतीं (M08 के postInvoice जैसा ही सिद्धांत:
    // पहले सारे side-effects, फिर status बदलो)।
    const ledgerResult = await this.ledgerBridge.postPaymentToLedger({
      companyId: tenantId,
      userId,
      partyType: normalizePartyType(payment.partyType),
      partyId: payment.partyId,
      amount: Number(amount),
      bankAccountId: payment.bankAccountId,
      referenceType: payment.referenceType,
      referenceId: payment.referenceId,
      narration: payment.narration,
      voucherDate: new Date(),
    });

    await this.prisma.$transaction(async (tx) => {
      const pRepo = new PaymentRepository(tx);
      const bRepo = new BankAccountRepository(tx);
      const lRepo = new LedgerRepository(tx);

      // Update payment status
      await pRepo.updateStatus(id, 'COMPLETED', tenantId, userId, gatewayRef, gatewayResponse);

      // Update bank account if linked — receipt बढ़ाता है, payment घटाता है
      if (payment.bankAccountId) {
        await bRepo.updateBalance(payment.bankAccountId, amount, tenantId, userId, isReceipt);
      }

      // M11 का अपना संक्षिप्त audit ledger (हर payment के लिए, चाहे M10 posting
      // लागू हो या न हो — ऊपर देखें कब M10 posting skip होती है)
      await lRepo.create(isReceipt ? [
        { transactionId: id, accountCode: 'CASH_BANK', debitAmount: amount, creditAmount: zeroDecimal(), narration: `Receipt - ${payment.narration || id}`, entryDate: new Date() },
        { transactionId: id, accountCode: 'ACCOUNTS_RECEIVABLE', debitAmount: zeroDecimal(), creditAmount: amount, narration: `Receipt - ${payment.narration || id}`, entryDate: new Date() },
      ] : [
        { transactionId: id, accountCode: 'ACCOUNTS_PAYABLE', debitAmount: amount, creditAmount: zeroDecimal(), narration: `Payment - ${payment.narration || id}`, entryDate: new Date() },
        { transactionId: id, accountCode: 'CASH_BANK', debitAmount: zeroDecimal(), creditAmount: amount, narration: `Payment - ${payment.narration || id}`, entryDate: new Date() },
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

    const updated = await this.getPayment(id, tenantId);
    // ledgerResult पारदर्शी रहे — caller को पता चले कि M10 में असली voucher बना या
    // (जान-बूझकर) skip हुआ, चुपचाप नहीं
    return { ...updated, ledgerPosting: ledgerResult };
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
