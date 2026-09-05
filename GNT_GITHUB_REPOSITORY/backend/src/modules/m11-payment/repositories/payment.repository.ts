// M11 Payment Module - Payment Transaction Repository
// Data Access Layer - Prisma queries with tenant isolation (fail-closed)
// (टास्क #025 B4: PaymentTransaction model के असली fields से मिलाया गया)

import { PrismaClient, Prisma, PaymentTransaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentFilter, CreatePaymentDto, UpdatePaymentDto, PaymentStatus, TransactionType } from '../types';
import { toDecimal } from '../utils/decimal.helper';

type Db = PrismaClient | Prisma.TransactionClient;

export class PaymentRepository {
  constructor(private prisma: Db) {}

  async findById(id: string, tenantId: string): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { id, tenantId },
      include: { paymentMethod: true },
    });
  }

  async findAll(filter: PaymentFilter, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      type,
      paymentMethodId,
      invoiceId,
      payerId,
      minAmount,
      maxAmount,
      startDate,
      endDate,
    } = filter;

    const where: Prisma.PaymentTransactionWhereInput = { tenantId };

    if (status) where.status = status;
    if (type) where.direction = type;
    if (paymentMethodId) where.paymentMethodId = paymentMethodId;
    if (invoiceId) where.referenceId = invoiceId;
    if (payerId) where.partyId = payerId;
    if (search) {
      where.OR = [
        { partyName: { contains: search, mode: 'insensitive' } },
        { partyContact: { contains: search, mode: 'insensitive' } },
        { narration: { contains: search, mode: 'insensitive' } },
        { providerRef: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = toDecimal(minAmount);
      if (maxAmount) where.amount.lte = toDecimal(maxAmount);
    }
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.paymentTransaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          paymentMethod: { select: { id: true, name: true } },
        },
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    return { data, total };
  }

  async create(dto: CreatePaymentDto, tenantId: string, userId: string, partyType: string, direction: 'IN' | 'OUT'): Promise<PaymentTransaction> {
    // पहले direction हमेशा 'OUT' hardcode थी — customer से आया receipt भी 'OUT' (हम भेज रहे)
    // दर्ज होता, cash-flow/dashboard हमेशा ग़लत होते। अब असली partyType से तय (payment.service.ts)।
    return this.prisma.paymentTransaction.create({
      data: {
        tenantId,
        transactionNumber: `TXN-${Date.now()}`,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'INR',
        baseAmount: toDecimal(dto.amount),
        status: 'PENDING',
        direction,
        paymentMethodId: dto.paymentMethodId,
        // पहले referenceType हमेशा 'INVOICE' (बिक्री) होता था, चाहे payerType VENDOR
        // ही क्यों न हो — यानी सप्लायर को दिया गया payment भी ग़लती से sales invoice
        // की तरह टैग होता, असली purchase bill कभी सही से लिंक नहीं होता।
        referenceType: dto.invoiceId ? (direction === 'IN' ? 'INVOICE' : 'BILL') : null,
        referenceId: dto.invoiceId || null,
        bankAccountId: dto.bankAccountId || null,
        partyName: dto.payerName || '',
        partyContact: dto.payerEmail || null,
        partyId: dto.payerId || '',
        partyType,
        narration: dto.description || null,
        transactionDate: new Date(),
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentDto, tenantId: string, userId: string): Promise<PaymentTransaction> {
    const result = await this.prisma.paymentTransaction.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.description !== undefined ? { narration: dto.description } : {}),
        ...(dto.gatewayRef !== undefined ? { providerRef: dto.gatewayRef } : {}),
        ...(dto.gatewayResponse !== undefined ? { providerResponse: dto.gatewayResponse as Prisma.InputJsonValue } : {}),
        updatedBy: userId,
      },
    });
    if (result.count === 0) throw new Error('Payment not found');
    const payment = await this.prisma.paymentTransaction.findFirst({ where: { id, tenantId } });
    if (!payment) throw new Error('Payment not found');
    return payment;
  }

  async updateStatus(id: string, status: string, tenantId: string, userId: string, providerRef?: string, providerResponse?: Record<string, unknown>): Promise<PaymentTransaction> {
    const result = await this.prisma.paymentTransaction.updateMany({
      where: { id, tenantId },
      data: {
        status,
        ...(providerRef ? { providerRef } : {}),
        ...(providerResponse ? { providerResponse: providerResponse as Prisma.InputJsonValue } : {}),
        updatedBy: userId,
      },
    });
    if (result.count === 0) throw new Error('Payment not found');
    const payment = await this.prisma.paymentTransaction.findFirst({ where: { id, tenantId } });
    if (!payment) throw new Error('Payment not found');
    return payment;
  }

  async delete(id: string, tenantId: string): Promise<PaymentTransaction> {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error('Payment not found');
    await this.prisma.paymentTransaction.deleteMany({ where: { id, tenantId } });
    return existing;
  }

  async getDashboardStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: Prisma.PaymentTransactionWhereInput = { tenantId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const [totalRevenue, totalPending, totalRefunded, transactionCount, completedCount, methodBreakdown] =
      await Promise.all([
        this.prisma.paymentTransaction.aggregate({
          where: { ...dateFilter, status: 'COMPLETED', direction: 'IN' },
          _sum: { amount: true },
        }),
        this.prisma.paymentTransaction.aggregate({
          where: { tenantId, status: 'PENDING' },
          _sum: { amount: true },
        }),
        this.prisma.paymentTransaction.aggregate({
          where: { tenantId, status: 'REFUNDED' },
          _sum: { amount: true },
        }),
        this.prisma.paymentTransaction.count({ where: dateFilter }),
        this.prisma.paymentTransaction.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
        this.prisma.paymentTransaction.groupBy({
          by: ['paymentMethodId'],
          where: { ...dateFilter, status: 'COMPLETED' },
          _sum: { amount: true },
          _count: { id: true },
        }),
      ]);

    const dailyTrend = await this.prisma.paymentTransaction.groupBy({
      by: ['transactionDate'],
      where: { ...dateFilter, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    return {
      totalRevenue: totalRevenue._sum.amount || new Decimal(0),
      totalPending: totalPending._sum.amount || new Decimal(0),
      totalRefunded: totalRefunded._sum.amount || new Decimal(0),
      transactionCount,
      successRate: transactionCount > 0 ? (completedCount / transactionCount) * 100 : 0,
      methodBreakdown: methodBreakdown.map((m) => ({
        method: m.paymentMethodId,
        amount: m._sum.amount || new Decimal(0),
        count: m._count.id,
      })),
      dailyTrend: dailyTrend.map((d) => ({
        date: d.transactionDate.toISOString().slice(0, 10),
        amount: d._sum.amount || new Decimal(0),
      })),
    };
  }

  async executeInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    if (!('$transaction' in this.prisma)) throw new Error('Transactions only available on PrismaClient');
    return (this.prisma as PrismaClient).$transaction(fn);
  }
}
