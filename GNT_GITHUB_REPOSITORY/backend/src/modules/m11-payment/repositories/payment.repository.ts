// M11 Payment Module - Payment Transaction Repository
// Data Access Layer - Prisma queries with tenant isolation
// (टास्क #025 B4: PaymentTransaction model के असली fields से मिलाया गया)

import { PrismaClient, Prisma, PaymentTransaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { PaymentFilter, CreatePaymentDto, UpdatePaymentDto, PaymentStatus, TransactionType } from '../types';
import { toDecimal } from '../utils/decimal.helper';

export class PaymentRepository {
  constructor(private prisma: PrismaClient) {}

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

  async create(dto: CreatePaymentDto, tenantId: string, userId: string): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.create({
      data: {
        tenantId,
        amount: toDecimal(dto.amount),
        currency: dto.currency || 'INR',
        status: 'PENDING',
        direction: 'OUT',
        paymentMethodId: dto.paymentMethodId,
        referenceType: dto.invoiceId ? 'INVOICE' : null,
        referenceId: dto.invoiceId || null,
        bankAccountId: dto.bankAccountId || null,
        partyName: dto.payerName || '',
        partyContact: dto.payerEmail || null,
        partyId: dto.payerId || '',
        partyType: dto.payerType || null,
        narration: dto.description || null,
        createdBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentDto, tenantId: string, userId: string): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.description !== undefined ? { narration: dto.description } : {}),
        ...(dto.gatewayRef !== undefined ? { providerRef: dto.gatewayRef } : {}),
        ...(dto.gatewayResponse !== undefined ? { providerResponse: dto.gatewayResponse as never } : {}),
      },
    });
  }

  async updateStatus(id: string, status: PaymentStatus, _tenantId: string, _userId: string, providerRef?: string, providerResponse?: Record<string, unknown>): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.update({
      where: { id },
      data: {
        status,
        providerRef: providerRef || undefined,
        providerResponse: (providerResponse as never) || undefined,
      },
    });
  }

  async delete(id: string, _tenantId: string): Promise<PaymentTransaction> {
    return this.prisma.paymentTransaction.delete({ where: { id } });
  }

  async getDashboardStats(tenantId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: Prisma.PaymentTransactionWhereInput = { tenantId };
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const [totalRevenue, totalPending, totalRefunded, transactionCount, completedCount, methodBreakdown, dailyTrend] =
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

  async executeInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }
}
