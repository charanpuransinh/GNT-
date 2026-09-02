/**
 * M08 SALES & BILLING — PUBLIC Sales Service
 * Module: m08-sales | Team: B4-BRAVO
 * PUBLIC CONTRACT: createInvoice, getInvoices, getInvoiceById, convertOrderToInvoice
 * RULE: All side effects go through Central Transaction Engine
 */

import { PrismaClient, SalesInvoice, SalesInvoiceItem, Prisma } from '@prisma/client';
import { salesRepository } from '../repositories/sales.repository';
import {
  SalesInvoiceDTO,
  SalesInvoiceItemDTO,
  InvoiceQueryParams,
  InvoicePaymentDTO,
  SalesInvoiceCreatedEvent,
  PaymentReceivedEvent,
} from '../types/sales.types';
import {
  calculateInvoiceTotals,
  generateInvoiceNumber,
  preparePrintData,
} from './sales.internal';
import { printService } from './print.service';
import { eventBus } from '../../../core/event-bus';

const prisma = new PrismaClient();

// ─── M05/M06/M09/M10/M11 PUBLIC CONTRACT INTERFACES (Design-Expansion stubs) ───
interface PartyService {
  getCustomerById(id: string): Promise<any>;
  getCompanyById(id: string): Promise<any>;
  checkCreditLimit(customerId: string, amount: number): Promise<{ allowed: boolean; limit: number; used: number }>;
}
interface StockService {
  checkAvailability(productId: string, branchId: string, quantity: number): Promise<{ available: boolean; stock: number }>;
  deductStock(items: Array<{ productId: string; batchId?: string; quantity: number }>, branchId: string): Promise<void>;
  addBackStock(items: Array<{ productId: string; quantity: number }>, branchId: string): Promise<void>;
}
interface GstService {
  calculateTax(items: Array<{ hsnCode: string; amount: number; taxRate: number }>, customerState: string, companyState: string): Promise<any>;
}
interface LedgerService {
  createEntry(entry: any): Promise<void>;
}
interface PaymentService {
  getInvoicePayments(invoiceId: string): Promise<any[]>;
  createDue(invoiceId: string, amount: number, dueDate: Date): Promise<void>;
}
interface NotificationService {
  sendInvoice(invoice: any, method: 'whatsapp' | 'email', recipient: string): Promise<void>;
}

// These will be injected via dependency container in production
let partyService: PartyService;
let stockService: StockService;
let gstService: GstService;
let ledgerService: LedgerService;
let paymentService: PaymentService;
let notificationService: NotificationService | undefined;

export function injectDependencies(deps: {
  partyService: PartyService;
  stockService: StockService;
  gstService: GstService;
  ledgerService: LedgerService;
  paymentService: PaymentService;
  notificationService?: NotificationService;
}) {
  partyService = deps.partyService;
  stockService = deps.stockService;
  gstService = deps.gstService;
  ledgerService = deps.ledgerService;
  paymentService = deps.paymentService;
  notificationService = deps.notificationService;
}

export class SalesService {
  // ─── CREATE INVOICE (DRAFT) ───
  async createInvoice(dto: SalesInvoiceDTO): Promise<SalesInvoice> {
    const totals = calculateInvoiceTotals(dto.items);
    const invoiceNumber = dto.invoiceNumber || await salesRepository.getNextInvoiceNumber(dto.companyId);

    const invoiceData: Prisma.SalesInvoiceUncheckedCreateInput = {
      companyId: dto.companyId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      salesOrderId: dto.salesOrderId || null,
      quotationId: dto.quotationId || null,
      invoiceNumber,
      invoiceDate: new Date(dto.invoiceDate),
      dueDate: new Date(dto.dueDate),
      status: 'draft',
      totalAmount: totals.totalAmount,
      totalTax: totals.totalTax,
      totalDiscount: totals.totalDiscount,
      netAmount: totals.netAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      paymentStatus: 'unpaid',
      amountPaid: 0,
      notes: dto.notes || null,
      termsConditions: dto.termsConditions || null,
      createdBy: dto.createdBy || null,
    };

    const itemsData: Prisma.SalesInvoiceItemCreateManySalesInvoiceInput[] = dto.items.map((item, idx) => {
      const calc = totals; // We recalc per item for precision
      const qty = Number(item.quantity);
      const rate = Number(item.rate);
      const discPercent = Number(item.discountPercent || 0);
      const gross = qty * rate;
      const discountAmount = (gross * discPercent) / 100;
      const amount = gross - discountAmount;
      const taxRate = Number(item.taxRate || 0);
      const taxAmount = (amount * taxRate) / 100;
      const netAmount = amount + taxAmount;

      return {
        productId: item.productId,
        batchId: item.batchId || null,
        quantity: qty,
        rate,
        discountPercent: discPercent,
        discountAmount,
        amount,
        taxRate,
        taxAmount,
        netAmount,
        hsnCode: item.hsnCode || null,
      };
    });

    const invoice = await salesRepository.createInvoice({ ...invoiceData, items: itemsData });
    return invoice;
  }

  // ─── GET INVOICES ───
  async getInvoices(params: InvoiceQueryParams): Promise<{ data: SalesInvoice[]; total: number }> {
    return salesRepository.getInvoices(params);
  }

  // ─── GET INVOICE BY ID ───
  async getInvoiceById(id: string, companyId: string): Promise<SalesInvoice & { items: SalesInvoiceItem[] } | null> {
    return salesRepository.getInvoiceById(id, companyId);
  }

  // ─── UPDATE INVOICE (DRAFT ONLY) ───
  async updateInvoice(id: string, companyId: string, dto: Partial<SalesInvoiceDTO>): Promise<SalesInvoice> {
    const existing = await salesRepository.getInvoiceById(id, companyId);
    if (!existing) throw new Error('Invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be updated');

    const updateData: Prisma.SalesInvoiceUpdateInput = {};
    if (dto.customerId) updateData.customerId = dto.customerId;
    if (dto.invoiceDate) updateData.invoiceDate = new Date(dto.invoiceDate);
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.termsConditions !== undefined) updateData.termsConditions = dto.termsConditions;

    if (dto.items && dto.items.length > 0) {
      const totals = calculateInvoiceTotals(dto.items);
      updateData.totalAmount = totals.totalAmount;
      updateData.totalTax = totals.totalTax;
      updateData.totalDiscount = totals.totalDiscount;
      updateData.netAmount = totals.netAmount;
      updateData.roundOff = totals.roundOff;
      updateData.grandTotal = totals.grandTotal;

      // Delete old items and recreate
      await prisma.salesInvoiceItem.deleteMany({ where: { salesInvoiceId: id } });
      const itemsData = dto.items.map((item) => {
        const qty = Number(item.quantity);
        const rate = Number(item.rate);
        const discPercent = Number(item.discountPercent || 0);
        const gross = qty * rate;
        const discountAmount = (gross * discPercent) / 100;
        const amount = gross - discountAmount;
        const taxRate = Number(item.taxRate || 0);
        const taxAmount = (amount * taxRate) / 100;
        const netAmount = amount + taxAmount;
        return {
          salesInvoiceId: id,
          productId: item.productId,
          batchId: item.batchId || null,
          quantity: qty,
          rate,
          discountPercent: discPercent,
          discountAmount,
          amount,
          taxRate,
          taxAmount,
          netAmount,
          hsnCode: item.hsnCode || null,
        };
      });
      await prisma.salesInvoiceItem.createMany({ data: itemsData });
    }

    return salesRepository.updateInvoice(id, companyId, updateData);
  }

  // ─── DELETE INVOICE (DRAFT ONLY) ───
  async deleteInvoice(id: string, companyId: string): Promise<void> {
    await salesRepository.deleteInvoice(id, companyId);
  }

  // ─── APPROVE INVOICE ───
  async approveInvoice(id: string, companyId: string, approvedBy: string): Promise<SalesInvoice> {
    const invoice = await salesRepository.getInvoiceById(id, companyId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'draft') throw new Error('Only draft invoices can be approved');

    return salesRepository.updateInvoiceStatus(id, companyId, 'approved', { approvedBy });
  }

  // ─── POST INVOICE (ATOMIC — triggers stock+GST+ledger+payment due) ───
  async postInvoice(id: string, companyId: string, postedBy: string): Promise<SalesInvoice> {
    const invoice = await salesRepository.getInvoiceById(id, companyId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'approved') throw new Error('Invoice must be approved before posting');

    if (!partyService || !stockService || !gstService || !ledgerService || !paymentService) {
      throw new Error('M08 posting dependencies are not fully wired');
    }
    const customer = await partyService.getCustomerById(invoice.customerId);
    const company = await partyService.getCompanyById(invoice.companyId);
    const customerState = customer?.state;
    const companyState = company?.state;
    if (!customerState || !companyState) throw new Error('Customer/company state is required for GST calculation');

    // 1. Credit limit check (M05)
    {
      const creditCheck = await partyService.checkCreditLimit(invoice.customerId, Number(invoice.grandTotal));
      if (!creditCheck.allowed) {
        throw new Error(`Credit limit exceeded. Limit: ${creditCheck.limit}, Used: ${creditCheck.used}`);
      }
    }

    // 2. Stock availability check (M06)
    {
      for (const item of invoice.items) {
        const stockCheck = await stockService.checkAvailability(item.productId, invoice.branchId, Number(item.quantity));
        if (!stockCheck.available) {
          throw new Error(`Insufficient stock for product ${item.productId}. Available: ${stockCheck.stock}`);
        }
      }
    }

    // 3. Execute atomic transaction via Central Transaction Engine
    await prisma.$transaction(async (tx) => {
      // a. Deduct stock (M06)
      {
        const stockItems = invoice.items.map((i) => ({
          productId: i.productId,
          batchId: i.batchId || undefined,
          quantity: Number(i.quantity),
        }));
        await stockService.deductStock(stockItems, invoice.branchId);
      }

      // b. Calculate GST (M09)
      {
        const gstItems = invoice.items.map((i) => ({
          hsnCode: i.hsnCode || '',
          amount: Number(i.amount),
          taxRate: Number(i.taxRate),
        }));
        await gstService.calculateTax(gstItems, customerState, companyState);
      }

      // c. Create ledger entry (M10)
      {
        await ledgerService.createEntry({
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          amount: Number(invoice.grandTotal),
          type: 'SALES',
          date: new Date(),
        });
      }

      // d. Create payment due (M11)
      {
        await paymentService.createDue(invoice.id, Number(invoice.grandTotal), invoice.dueDate);
      }

      // e. Update invoice status to posted
      await tx.salesInvoice.update({
        where: { id },
        data: { status: 'posted', postedBy },
      });
    });

    // 4. Publish event (M16, M17)
    const eventPayload: SalesInvoiceCreatedEvent = {
      invoiceId: invoice.id,
      customerId: invoice.customerId,
      totalAmount: Number(invoice.totalAmount),
      taxAmount: Number(invoice.totalTax),
      items: invoice.items.map((i) => ({
        productId: i.productId,
        quantity: Number(i.quantity),
        rate: Number(i.rate),
        netAmount: Number(i.netAmount),
      })),
      grandTotal: Number(invoice.grandTotal),
      companyId: invoice.companyId,
      branchId: invoice.branchId,
    };
    await eventBus.publish('sales.invoice.created', eventPayload);

    return salesRepository.getInvoiceById(id, companyId) as Promise<any>;
  }

  // ─── RECORD PAYMENT ───
  async recordPayment(id: string, companyId: string, payment: InvoicePaymentDTO): Promise<SalesInvoice> {
    const invoice = await salesRepository.getInvoiceById(id, companyId);
    if (!invoice) throw new Error('Invoice not found');

    if (!Number.isFinite(payment.amount) || payment.amount <= 0) throw new Error('Payment amount must be greater than 0');
    if (invoice.status === 'cancelled' || invoice.status === 'draft') throw new Error('Payments can only be recorded for approved or posted invoices');
    const currentPaid = Number(invoice.amountPaid) + payment.amount;
    const grandTotal = Number(invoice.grandTotal);
    if (currentPaid > grandTotal) throw new Error('Payment exceeds invoice balance');
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (currentPaid >= grandTotal) paymentStatus = 'paid';
    else if (currentPaid > 0) paymentStatus = 'partial';

    return salesRepository.updatePaymentStatus(id, companyId, paymentStatus, currentPaid);
  }

  // ─── GENERATE PRINT ───
  async generatePrint(invoiceId: string, companyId: string, template: 'thermal-2inch' | 'thermal-3inch' | 'a4'): Promise<string> {
    const invoice = await salesRepository.getInvoiceById(invoiceId, companyId);
    if (!invoice) throw new Error('Invoice not found');

    if (!partyService) throw new Error('Party/company service is not wired');
    const customer = await partyService.getCustomerById(invoice.customerId);
    const company = await partyService.getCompanyById(invoice.companyId);
    if (!customer || !company) throw new Error('Customer or company master data not found');

    const printData = preparePrintData(invoice as any, customer, company, invoice.items as any);
    return printService.generatePrint(template, printData);
  }

  // ─── SHARE INVOICE ───
  async shareInvoice(invoiceId: string, companyId: string, method: 'whatsapp' | 'email', recipient: string): Promise<{ success: boolean; message: string }> {
    const invoice = await salesRepository.getInvoiceById(invoiceId, companyId);
    if (!invoice) throw new Error('Invoice not found');

    if (!notificationService) throw new Error('Notification service is not wired');
    await notificationService.sendInvoice(invoice, method, recipient);
    return { success: true, message: `${method} invoice notification sent` };
  }

  // ─── CONVERT ORDER TO INVOICE ───
  async convertOrderToInvoice(orderId: string, companyId: string, dto: Partial<SalesInvoiceDTO>): Promise<SalesInvoice> {
    const order = await prisma.salesOrder.findFirst({
      where: { id: orderId, companyId },
      include: { items: true },
    });
    if (!order) throw new Error('Sales order not found');
    if (order.status === 'cancelled') throw new Error('Cannot convert cancelled order');

    const invoiceItems: SalesInvoiceItemDTO[] = order.items.map((item) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      discountPercent: Number(item.discountPercent),
      taxRate: Number(item.taxRate),
      hsnCode: '', // Would come from product master
    }));

    const invoiceDto: SalesInvoiceDTO = {
      companyId: order.companyId,
      branchId: order.branchId,
      customerId: order.customerId,
      salesOrderId: order.id,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      items: invoiceItems,
      notes: `Converted from Order ${order.orderNumber}`,
      ...dto,
    };

    const invoice = await this.createInvoice(invoiceDto);

    // Update order status
    await prisma.salesOrder.update({
      where: { id: orderId },
      data: { status: 'delivered' },
    });

    return invoice;
  }

  // ─── HANDLE PAYMENT RECEIVED EVENT (from M11) ───
  async handlePaymentReceived(event: PaymentReceivedEvent): Promise<void> {
    const invoice = await salesRepository.getInvoiceById(event.invoiceId, event.companyId);
    if (!invoice) return;

    const currentPaid = Number(invoice.amountPaid) + event.amount;
    const grandTotal = Number(invoice.grandTotal);
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (currentPaid >= grandTotal) paymentStatus = 'paid';
    else if (currentPaid > 0) paymentStatus = 'partial';

    await salesRepository.updatePaymentStatus(event.invoiceId, event.companyId, paymentStatus, currentPaid);
  }
}

export const salesService = new SalesService();
