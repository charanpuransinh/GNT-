// M11 Payment Module - Invoice Service

import { PrismaClient } from '@prisma/client';
import { InvoiceRepository } from '../repositories/invoice.repository';
import { PaymentRepository } from '../repositories/payment.repository';
import { EventBus } from '../events/event.bus';
import {
  InvoiceFilter, CreateInvoiceDto, UpdateInvoiceDto,
  InvoiceDashboardStats, InvoiceCreatedEvent,
  ApiError,
} from '../types';

export class InvoiceService {
  private invoiceRepo: InvoiceRepository;
  private paymentRepo: PaymentRepository;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.invoiceRepo = new InvoiceRepository(prisma);
    this.paymentRepo = new PaymentRepository(prisma);
    this.eventBus = eventBus;
  }

  async getInvoice(id: string, tenantId: string) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) throw this.notFound('Invoice not found');
    return invoice;
  }

  async getInvoiceByNumber(invoiceNumber: string, tenantId: string) {
    const invoice = await this.invoiceRepo.findByNumber(invoiceNumber, tenantId);
    if (!invoice) throw this.notFound('Invoice not found');
    return invoice;
  }

  async listInvoices(filter: InvoiceFilter, tenantId: string) {
    return this.invoiceRepo.findAll(filter, tenantId);
  }

  async createInvoice(dto: CreateInvoiceDto, tenantId: string, userId: string) {
    // Validate customer via M06 PUBLIC API (mock - in real app calls M06 service)
    // await this.validateCustomer(dto.customerId, tenantId);

    const invoice = await this.invoiceRepo.create(dto, tenantId, userId);

    // Publish event
    const event: InvoiceCreatedEvent = {
      invoiceId: invoice.id,
      tenantId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      totalAmount: invoice.totalAmount.toString(),
      dueDate: invoice.dueDate,
      timestamp: new Date(),
    };
    this.eventBus.publish('invoice.created', event);
    this.eventBus.publish('customer.invoice_generated', { // M06 notification
      customerId: invoice.customerId,
      tenantId,
      invoiceId: invoice.id,
      amount: invoice.totalAmount.toString(),
    });

    return invoice;
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto, tenantId: string, userId: string) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) throw this.notFound('Invoice not found');
    if (invoice.status === 'PAID') throw this.badRequest('Cannot update paid invoice');

    return this.invoiceRepo.update(id, dto, tenantId, userId);
  }

  async sendInvoice(id: string, tenantId: string, userId: string) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) throw this.notFound('Invoice not found');
    if (invoice.status !== 'DRAFT') throw this.badRequest('Invoice must be in draft status');

    const updated = await this.invoiceRepo.updateStatus(id, 'SENT', tenantId, userId);

    this.eventBus.publish('invoice.sent', {
      invoiceId: id,
      tenantId,
      customerEmail: invoice.customerEmail,
      timestamp: new Date(),
    });

    return updated;
  }

  async cancelInvoice(id: string, tenantId: string, userId: string) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) throw this.notFound('Invoice not found');
    if (invoice.status === 'PAID') throw this.badRequest('Cannot cancel paid invoice');

    return this.invoiceRepo.updateStatus(id, 'CANCELLED', tenantId, userId);
  }

  async deleteInvoice(id: string, tenantId: string) {
    const invoice = await this.invoiceRepo.findById(id, tenantId);
    if (!invoice) throw this.notFound('Invoice not found');
    if (invoice.status === 'PAID') throw this.badRequest('Cannot delete paid invoice');
    if ((invoice.paidAmount as any).gt(0)) throw this.badRequest('Cannot delete invoice with payments');

    return this.invoiceRepo.delete(id, tenantId);
  }

  async getDashboardStats(tenantId: string): Promise<InvoiceDashboardStats> {
    return this.invoiceRepo.getDashboardStats(tenantId) as Promise<InvoiceDashboardStats>;
  }

  async getOverdueInvoices(tenantId: string) {
    return this.invoiceRepo.findAll({ isOverdue: true, page: 1, limit: 100 }, tenantId);
  }

  // ==================== ERROR HELPERS ====================
  private notFound(message: string): ApiError {
    return { code: 'NOT_FOUND', message };
  }

  private badRequest(message: string): ApiError {
    return { code: 'BAD_REQUEST', message };
  }
}
