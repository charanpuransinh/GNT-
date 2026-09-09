/**
 * M08 SALES & BILLING — PUBLIC Sales Service
 * Module: m08-sales | Team: B4-BRAVO
 * PUBLIC CONTRACT: createInvoice, getInvoices, getInvoiceById, convertOrderToInvoice
 * RULE: All side effects go through Central Transaction Engine
 */

import { prisma } from '@/common/config/prisma';
import { CompanyRepository } from '@/modules/m04-company-management';
import { partyService as m05PartyService } from '@/modules/m05-party-management';
import { InvoiceLedgerService } from '@/modules/m10-accounting';
import { notificationService as m16NotificationService } from '@/modules/m16-notification';
import { Prisma, SalesInvoice, SalesInvoiceItem } from '@prisma/client';
import { eventBus } from '../../../core/event-bus';
import { salesRepository } from '../repositories/sales.repository';
import {
  InvoicePaymentDTO,
  InvoiceQueryParams,
  PaymentReceivedEvent,
  SalesInvoiceCreatedEvent,
  SalesInvoiceDTO,
  SalesInvoiceItemDTO,
} from '../types/sales.types';
import { printService } from './print.service';
import { calculateInvoiceTotals, generateInvoiceNumber, preparePrintData } from './sales.internal';

// M10 accrual entry — invoice post होते ही double-entry ledger (मालिक P0, 2026-09-06).
// DI (injectDependencies) कभी wire नहीं होती थी; यह direct है, हमेशा चलती है।
const invoiceLedgerService = new InvoiceLedgerService(prisma);
// print/share के लिए भी direct wiring (injectDependencies पर निर्भरता हटाई — audit 2026-09-09):
const companyRepo = new CompanyRepository(prisma);

// audit 2026-09-09: injectDependencies() + let-DI vars हटाए गए — production में कभी
// inject नहीं होते थे, हर उन पर टिकी method 500 देती थी। हर cross-module call अब
// direct public API से (M05 partyService, M04 companyRepo, M16 notificationService,
// M10 invoiceLedgerService)।

export class SalesService {
  // ─── CREATE INVOICE (DRAFT) ───
  async createInvoice(dto: SalesInvoiceDTO): Promise<SalesInvoice> {
    const totals = calculateInvoiceTotals(dto.items);
    const invoiceNumber =
      dto.invoiceNumber || (await salesRepository.getNextInvoiceNumber(dto.companyId));

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

    const itemsData: Prisma.SalesInvoiceItemCreateManySalesInvoiceInput[] = dto.items.map(
      (item, idx) => {
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
      }
    );

    const invoice = await salesRepository.createInvoice({ ...invoiceData, items: itemsData });
    return invoice;
  }

  // ─── GET INVOICES ───
  async getInvoices(params: InvoiceQueryParams): Promise<{ data: SalesInvoice[]; total: number }> {
    return salesRepository.getInvoices(params);
  }

  // ─── GET INVOICE BY ID ───
  async getInvoiceById(
    id: string,
    companyId: string
  ): Promise<(SalesInvoice & { items: SalesInvoiceItem[] }) | null> {
    return salesRepository.getInvoiceById(id, companyId);
  }

  // ─── UPDATE INVOICE (DRAFT ONLY) ───
  async updateInvoice(
    id: string,
    companyId: string,
    dto: Partial<SalesInvoiceDTO>
  ): Promise<SalesInvoice> {
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

  // ─── POST INVOICE — accrual ledger entry + status posted ───
  //
  // 2026-09-06 (मालिक P0): पहले यह पूरी method injectDependencies() पर टिकी थी जो
  // production में कभी call नहीं होती → हर post "M08 posting dependencies are not
  // fully wired" पर throw करता था, यानी कोई invoice कभी post हो ही नहीं सकता था।
  // अब M10 का accrual voucher (Dr Debtors / Cr Sales / Cr GST Output) सीधे बनता है।
  //
  // credit-limit जाँच सिर्फ़ तब चलती है जब M05 adapter inject हुआ हो (अभी नहीं —
  // future)। Stock deduction on-post अलग काम है (M06 adapter) — अगले sprint,
  // owner ने अलग रखा; sale पर stock delivery-challan के रास्ते घटता है।
  async postInvoice(id: string, companyId: string, postedBy: string): Promise<SalesInvoice> {
    const invoice = await salesRepository.getInvoiceById(id, companyId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status !== 'approved') throw new Error('Invoice must be approved before posting');

    // credit-limit जाँच — M05 से असली (M05 की `checkCreditLimit` अभी outstanding 0
    // मानती है, वह M05 का अपना TODO#016 है; यहाँ का wiring सही है)।
    // party मौजूद न हो → यह createInvoice की जाँच है, post को block नहीं करती।
    const creditCheck = await m05PartyService.checkCreditLimit(
      invoice.customerId,
      companyId,
      Number(invoice.grandTotal)
    );
    if (!creditCheck.allowed && creditCheck.reason !== 'Party not found') {
      throw new Error(
        `Credit limit exceeded. Limit: ${creditCheck.limit}, Used: ${creditCheck.used}`
      );
    }
    // stock deduction on-post: owner ने अलग रखा — sale पर stock delivery-challan
    // के रास्ते घटता है (M08 challan flow), invoice-post पर नहीं।

    // पहले M10 accrual entry, फिर status 'posted' — अगर ledger फटा तो invoice
    // 'approved' ही रहता है (books के बिना कभी "posted" नहीं दिखता)। M10 खुद
    // idempotent है इसलिए retry सुरक्षित।
    const ledgerResult = await invoiceLedgerService.postSalesInvoice(companyId, id, postedBy);
    if (!ledgerResult.posted && ledgerResult.reason !== 'already posted to ledger') {
      throw new Error(`M08→M10 ledger posting failed: ${ledgerResult.reason}`);
    }

    await prisma.salesInvoice.update({ where: { id }, data: { status: 'posted', postedBy } });

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
  async recordPayment(
    id: string,
    companyId: string,
    payment: InvoicePaymentDTO
  ): Promise<SalesInvoice> {
    const invoice = await salesRepository.getInvoiceById(id, companyId);
    if (!invoice) throw new Error('Invoice not found');

    if (!Number.isFinite(payment.amount) || payment.amount <= 0)
      throw new Error('Payment amount must be greater than 0');
    if (invoice.status === 'cancelled' || invoice.status === 'draft')
      throw new Error('Payments can only be recorded for approved or posted invoices');
    const currentPaid = Number(invoice.amountPaid) + payment.amount;
    const grandTotal = Number(invoice.grandTotal);
    if (currentPaid > grandTotal) throw new Error('Payment exceeds invoice balance');
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (currentPaid >= grandTotal) paymentStatus = 'paid';
    else if (currentPaid > 0) paymentStatus = 'partial';

    return salesRepository.updatePaymentStatus(id, companyId, paymentStatus, currentPaid);
  }

  // ─── GENERATE PRINT ───
  // पहले injectDependencies() पर टिकी थी (जो कभी call नहीं होती) → हमेशा 500।
  // अब M05 partyService + M04 companyRepo सीधे — endpoint असल में चलता है।
  async generatePrint(
    invoiceId: string,
    companyId: string,
    template: 'thermal-2inch' | 'thermal-3inch' | 'a4'
  ): Promise<string> {
    const invoice = await salesRepository.getInvoiceById(invoiceId, companyId);
    if (!invoice) throw new Error('Invoice not found');

    const customer = await m05PartyService.getCustomerById(invoice.customerId, companyId);
    const company = await companyRepo.findById(companyId);
    if (!company) throw new Error('Company master data not found');

    const printData = preparePrintData(
      invoice as any,
      customer ? { ...customer, address: (customer as any).billing_address } : null,
      company,
      invoice.items as any
    );
    return printService.generatePrint(template, printData);
  }

  // ─── SHARE INVOICE ───
  // पहले notificationService (DI) कभी wire नहीं होती → हमेशा 500।
  // अब M16 notificationService.sendNotification() सीधे।
  async shareInvoice(
    invoiceId: string,
    companyId: string,
    method: 'whatsapp' | 'email',
    recipient: string,
    userId?: string
  ): Promise<{ success: boolean; message: string }> {
    const invoice = await salesRepository.getInvoiceById(invoiceId, companyId);
    if (!invoice) throw new Error('Invoice not found');
    if (!recipient?.trim()) throw new Error('recipient (phone/email) is required');

    const res = await m16NotificationService.sendNotification({
      userId: userId ?? invoice.createdBy ?? 'system',
      companyId,
      title: `Invoice ${invoice.invoiceNumber}`,
      message: `Invoice ${invoice.invoiceNumber} for ₹${Number(invoice.grandTotal).toFixed(2)}`,
      type: method === 'email' ? 'email' : 'whatsapp',
      entityType: 'sales_invoice',
      entityId: invoiceId,
      toAddress: recipient.trim(),
    });
    return { success: true, message: `${method} invoice notification queued (${res.status})` };
  }

  // ─── CONVERT ORDER TO INVOICE ───
  async convertOrderToInvoice(
    orderId: string,
    companyId: string,
    dto: Partial<SalesInvoiceDTO>
  ): Promise<SalesInvoice> {
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

    await salesRepository.updatePaymentStatus(
      event.invoiceId,
      event.companyId,
      paymentStatus,
      currentPaid
    );
  }
}

export const salesService = new SalesService();
