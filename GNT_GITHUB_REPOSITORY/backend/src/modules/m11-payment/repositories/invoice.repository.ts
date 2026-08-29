// M11 Payment Module - Invoice Repository

import { PrismaClient, Prisma, Invoice, InvoiceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { InvoiceFilter, CreateInvoiceDto, UpdateInvoiceDto, CreateLineItemDto } from '../types';
import { toDecimal, calculateInvoiceTotals } from '../utils/decimal.helper';

export class InvoiceRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        lineItems: true,
        transactions: { select: { id: true, amount: true, status: true, createdAt: true } },
      },
    }) as Promise<Invoice | null>;
  }

  async findByNumber(invoiceNumber: string, tenantId: string): Promise<Invoice | null> {
    return this.prisma.invoice.findFirst({
      where: { invoiceNumber, tenantId },
      include: { lineItems: true },
    }) as Promise<Invoice | null>;
  }

  async findAll(filter: InvoiceFilter, tenantId: string) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      customerId,
      minAmount,
      maxAmount,
      isOverdue,
      startDate,
      endDate,
    } = filter;

    const where: Prisma.InvoiceWhereInput = { tenantId };

    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minAmount || maxAmount) {
      where.totalAmount = {};
      if (minAmount) where.totalAmount.gte = toDecimal(minAmount);
      if (maxAmount) where.totalAmount.lte = toDecimal(maxAmount);
    }
    if (isOverdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['PAID', 'CANCELLED', 'WRITTEN_OFF'] };
    }
    if (startDate || endDate) {
      where.invoiceDate = {};
      if (startDate) where.invoiceDate.gte = startDate;
      if (endDate) where.invoiceDate.lte = endDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          lineItems: { select: { id: true, productName: true, totalAmount: true } },
          transactions: { select: { id: true, amount: true, status: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return { data, total };
  }

  async create(dto: CreateInvoiceDto, tenantId: string, userId: string): Promise<Invoice> {
    const lineItems = dto.lineItems.map(item => ({
      tenantId,
      productId: item.productId || null,
      productName: item.productName,
      description: item.description || null,
      quantity: toDecimal(item.quantity),
      unitPrice: toDecimal(item.unitPrice),
      taxRate: item.taxRate ? toDecimal(item.taxRate) : null,
      taxAmount: new Decimal(0), // calculated below
      discountPercent: item.discountPercent ? toDecimal(item.discountPercent) : null,
      discountAmount: new Decimal(0),
      totalAmount: new Decimal(0),
      createdBy: userId,
      updatedBy: userId,
    }));

    // Calculate totals
    const calculated = calculateInvoiceTotals(lineItems.map(li => ({
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      taxRate: li.taxRate,
      discountPercent: li.discountPercent,
    })));

    // Update line items with calculated values
    const finalLineItems = dto.lineItems.map((item, idx) => {
      const qty = toDecimal(item.quantity);
      const price = toDecimal(item.unitPrice);
      const lineTotal = qty.mul(price);
      const discPct = item.discountPercent ? toDecimal(item.discountPercent) : new Decimal(0);
      const discAmt = lineTotal.mul(discPct).div(100);
      const taxable = lineTotal.sub(discAmt);
      const taxPct = item.taxRate ? toDecimal(item.taxRate) : new Decimal(0);
      const taxAmt = taxable.mul(taxPct).div(100);
      const total = taxable.add(taxAmt);

      return {
        tenantId,
        productId: item.productId || null,
        productName: item.productName,
        description: item.description || null,
        quantity: qty,
        unitPrice: price,
        taxRate: item.taxRate ? toDecimal(item.taxRate) : null,
        taxAmount: taxAmt,
        discountPercent: item.discountPercent ? toDecimal(item.discountPercent) : null,
        discountAmount: discAmt,
        totalAmount: total,
        createdBy: userId,
        updatedBy: userId,
      };
    });

    const subTotal = finalLineItems.reduce((sum, li) => sum.add(li.totalAmount), new Decimal(0));
    const taxAmount = finalLineItems.reduce((sum, li) => sum.add(li.taxAmount), new Decimal(0));
    const discountAmount = finalLineItems.reduce((sum, li) => sum.add(li.discountAmount), new Decimal(0));

    return this.prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber: await this.generateInvoiceNumber(tenantId),
        series: 'INV',
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerEmail: dto.customerEmail || null,
        customerPhone: dto.customerPhone || null,
        customerGstin: dto.customerGstin || null,
        subTotal,
        taxAmount,
        discountAmount,
        totalAmount: subTotal,
        paidAmount: new Decimal(0),
        dueAmount: subTotal,
        currency: 'INR',
        taxRate: null,
        invoiceDate: dto.invoiceDate,
        dueDate: dto.dueDate,
        paidDate: null,
        status: 'DRAFT',
        notes: dto.notes || null,
        terms: dto.terms || null,
        metadata: dto.metadata || null,
        createdBy: userId,
        updatedBy: userId,
        lineItems: { createMany: { data: finalLineItems } },
      },
      include: { lineItems: true },
    }) as Promise<Invoice>;
  }

  async update(id: string, dto: UpdateInvoiceDto, tenantId: string, userId: string): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: userId,
      },
      include: { lineItems: true },
    }) as Promise<Invoice>;
  }

  async updateStatus(id: string, status: InvoiceStatus, tenantId: string, userId: string): Promise<Invoice> {
    return this.prisma.invoice.update({
      where: { id },
      data: { status, updatedBy: userId },
      include: { lineItems: true },
    }) as Promise<Invoice>;
  }

  async updatePaidAmount(id: string, amount: Decimal, tenantId: string, userId: string): Promise<Invoice> {
    const invoice = await this.findById(id, tenantId);
    if (!invoice) throw new Error('Invoice not found');

    const newPaid = (invoice.paidAmount as Decimal).add(amount);
    const newDue = (invoice.totalAmount as Decimal).sub(newPaid);
    let newStatus: InvoiceStatus = invoice.status;
    let paidDate = invoice.paidDate;

    if (newDue.lte(0)) {
      newStatus = 'PAID';
      paidDate = new Date();
    } else if (newPaid.gt(0)) {
      newStatus = 'PARTIAL_PAID';
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaid,
        dueAmount: newDue,
        status: newStatus,
        paidDate,
        updatedBy: userId,
      },
      include: { lineItems: true },
    }) as Promise<Invoice>;
  }

  async delete(id: string, tenantId: string): Promise<Invoice> {
    return this.prisma.invoice.delete({
      where: { id },
      include: { lineItems: true },
    }) as Promise<Invoice>;
  }

  // ==================== HELPERS ====================
  private async generateInvoiceNumber(tenantId: string): Promise<string> {
    const count = await this.prisma.invoice.count({ where: { tenantId } });
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const seq = String(count + 1).padStart(5, '0');
    return `INV-${year}${month}-${seq}`;
  }

  async getDashboardStats(tenantId: string) {
    const [
      totalInvoiced,
      totalPaid,
      totalOverdue,
      invoiceCount,
      paidCount,
      overdueCount,
      aging,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { tenantId }, _sum: { totalAmount: true } }),
      this.prisma.invoice.aggregate({ where: { tenantId }, _sum: { paidAmount: true } }),
      this.prisma.invoice.aggregate({
        where: { tenantId, status: { notIn: ['PAID', 'CANCELLED', 'WRITTEN_OFF'] }, dueDate: { lt: new Date() } },
        _sum: { dueAmount: true },
      }),
      this.prisma.invoice.count({ where: { tenantId } }),
      this.prisma.invoice.count({ where: { tenantId, status: 'PAID' } }),
      this.prisma.invoice.count({
        where: { tenantId, status: { notIn: ['PAID', 'CANCELLED', 'WRITTEN_OFF'] }, dueDate: { lt: new Date() } },
      }),
      this.prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId },
        _sum: { totalAmount: true, dueAmount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalInvoiced: totalInvoiced._sum.totalAmount || new Decimal(0),
      totalPaid: totalPaid._sum.paidAmount || new Decimal(0),
      totalOverdue: totalOverdue._sum.dueAmount || new Decimal(0),
      invoiceCount,
      paidCount,
      overdueCount,
      agingReport: aging,
    };
  }
}
