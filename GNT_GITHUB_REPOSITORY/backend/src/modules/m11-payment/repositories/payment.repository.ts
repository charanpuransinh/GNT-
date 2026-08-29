// M11 Payment Module - Payment Transaction Repository
// Data Access Layer - Prisma queries with tenant isolation

import { PrismaClient, Prisma, PaymentTransaction, PaymentStatus, TransactionType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentFilter, CreatePaymentDto, UpdatePaymentDto } from '../types';
import { toDecimal } from '../utils/decimal.helper';

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

  // ==================== CRUD ====================
  async findById(id: string, tenantId: string): Promise<PaymentTransaction | null> {
    return this.prisma.paymentTransaction.findFirst({
      where: { id, tenantId },
      include: {
        paymentMethod: true,
        invoice: { include: { lineItems: true } },
        bankAccount: true,
        refunds: true,
        ledgerEntries: true,
      },
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
    if (type) where.type = type;
    if (paymentMethodId) where.paymentMethodId = paymentMethodId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (payerId) where.payerId = payerId;
    if (search) {
      where.OR = [
        { payerName: { contains: search, mode: 'insensitive' } },
        { payerEmail: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { gatewayRef: { contains: search, mode: 'insensitive' } },
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
          paymentMethod: { select: { id: true, name: true, type: true } },
          invoice: { select: { id: true, invoiceNumber: true, status: true } },
          bankAccount: { select: { id: true, accountName: true, accountNumber: true } },
        },
      }),
      this.prisma.paymentTransaction.count({ where }),
    ]);

    return { data, total };
  }

  async create(dto: CreatePaymentDto, tenantId: string, userId: string): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.create({
      data: {
        tenantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'INR',
        status: 'PENDING',
        type: 'PAYMENT',
        paymentMethodId: dto.paymentMethodId,
        invoiceId: dto.invoiceId || null,
        bankAccountId: dto.bankAccountId || null,
        payerName: dto.payerName || null,
        payerEmail: dto.payerEmail || null,
        payerPhone: dto.payerPhone || null,
        payerId: dto.payerId || null,
        payerType: dto.payerType || null,
        description: dto.description || null,
        metadata: dto.metadata || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentDto, tenantId: string, userId: string): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
    });
  }

  async updateStatus(id: string, status: PaymentStatus, tenantId: string, userId: string, gatewayRef?: string, gatewayResponse?: Record<string, unknown>): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.update({
      where: { id },
      data: {
        status,
        gatewayRef: gatewayRef || undefined,
        gatewayResponse: gatewayResponse || undefined,
        updatedBy: userId,
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.delete({
      where: { id },
    });
  }

  // ==================== AGGREGATIONS ====================
  async getDashboardStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: Prisma.PaymentTransactionWhereInput = { tenantId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const [
      totalRevenue,
      totalPending,
      totalRefunded,
      transactionCount,
      completedCount,
      methodBreakdown,
      dailyTrend,
    ] = await Promise.all([
      this.prisma.paymentTransaction.aggregate({
        where: { ...dateFilter, status: 'COMPLETED', type: 'PAYMENT' },
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
      this.prisma.paymentTransaction.groupBy({
        by: ['createdAt'],
        where: { ...dateFilter, status: 'COMPLETED' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || new Decimal(0),
      totalPending: totalPending._sum.amount || new Decimal(0),
      totalRefunded: totalRefunded._sum.amount || new Decimal(0),
      transactionCount,
      successRate: transactionCount > 0 ? (completedCount / transactionCount) * 100 : 0,
      methodBreakdown,
      dailyTrend,
    };
  }

  // ==================== TRANSACTIONS ====================
  async executeInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
