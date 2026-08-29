/**
 * M08 SALES & BILLING — Quotation Service
 * Module: m08-sales | Team: B4-BRAVO
 * Handles: Quotation CRUD + Convert to Order
 */

import { PrismaClient, Quotation, SalesOrder } from '@prisma/client';
import { quotationRepository } from '../repositories/quotation.repository';
import { salesRepository } from '../repositories/sales.repository';
import {
  QuotationDTO,
  QuotationQueryParams,
  SalesOrderDTO,
  SalesOrderItemDTO,
  SalesQuotationConvertedEvent,
} from '../types/sales.types';
import {
  calculateQuotationTotals,
  generateQuotationNumber,
  generateOrderNumber,
} from './sales.internal';
import { eventBus } from '../../../core/event-bus';

const prisma = new PrismaClient();

export class QuotationService {
  // ─── CREATE QUOTATION ───
  async createQuotation(dto: QuotationDTO): Promise<Quotation> {
    const totals = calculateQuotationTotals(dto.items);
    const quotationNumber = dto.quotationNumber || await quotationRepository.getNextQuotationNumber(dto.companyId);

    const quotationData = {
      companyId: dto.companyId,
      branchId: dto.branchId,
      customerId: dto.customerId,
      quotationNumber,
      quotationDate: new Date(dto.quotationDate),
      expiryDate: new Date(dto.expiryDate),
      status: 'draft' as const,
      totalAmount: totals.totalAmount,
      totalTax: totals.totalTax,
      totalDiscount: totals.totalDiscount,
      netAmount: totals.netAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      notes: dto.notes || null,
      createdBy: dto.createdBy || null,
      items: dto.items.map((item) => {
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
      }),
    };

    return quotationRepository.createQuotation(quotationData as any);
  }

  // ─── GET QUOTATIONS ───
  async getQuotations(params: QuotationQueryParams): Promise<{ data: Quotation[]; total: number }> {
    return quotationRepository.getQuotations(params);
  }

  // ─── GET QUOTATION BY ID ───
  async getQuotationById(id: string, companyId: string): Promise<Quotation & { items: any[] } | null> {
    return quotationRepository.getQuotationById(id, companyId);
  }

  // ─── UPDATE QUOTATION ───
  async updateQuotation(id: string, companyId: string, dto: Partial<QuotationDTO>): Promise<Quotation> {
    const existing = await quotationRepository.getQuotationById(id, companyId);
    if (!existing) throw new Error('Quotation not found');
    if (existing.status === 'converted') throw new Error('Cannot update converted quotation');

    const updateData: any = {};
    if (dto.customerId) updateData.customerId = dto.customerId;
    if (dto.quotationDate) updateData.quotationDate = new Date(dto.quotationDate);
    if (dto.expiryDate) updateData.expiryDate = new Date(dto.expiryDate);
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    if (dto.items && dto.items.length > 0) {
      const totals = calculateQuotationTotals(dto.items);
      updateData.totalAmount = totals.totalAmount;
      updateData.totalTax = totals.totalTax;
      updateData.totalDiscount = totals.totalDiscount;
      updateData.netAmount = totals.netAmount;
      updateData.roundOff = totals.roundOff;
      updateData.grandTotal = totals.grandTotal;

      await prisma.quotationItem.deleteMany({ where: { quotationId: id } });
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
          quotationId: id,
          productId: item.productId,
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
      await prisma.quotationItem.createMany({ data: itemsData });
    }

    return quotationRepository.updateQuotation(id, companyId, updateData);
  }

  // ─── SEND QUOTATION ───
  async sendQuotation(id: string, companyId: string): Promise<Quotation> {
    const quotation = await quotationRepository.getQuotationById(id, companyId);
    if (!quotation) throw new Error('Quotation not found');
    if (quotation.status !== 'draft') throw new Error('Only draft quotations can be sent');

    return quotationRepository.updateQuotationStatus(id, companyId, 'sent');
  }

  // ─── CONVERT QUOTATION TO ORDER ───
  async convertQuotationToOrder(id: string, companyId: string, dto?: Partial<SalesOrderDTO>): Promise<SalesOrder> {
    const quotation = await quotationRepository.getQuotationById(id, companyId);
    if (!quotation) throw new Error('Quotation not found');
    if (quotation.status === 'converted') throw new Error('Quotation already converted');
    if (quotation.status === 'rejected') throw new Error('Cannot convert rejected quotation');

    const orderNumber = await salesRepository.getNextInvoiceNumber(companyId, 'ORD');
    const orderItems: SalesOrderItemDTO[] = quotation.items.map((item: any) => ({
      productId: item.productId,
      quantity: Number(item.quantity),
      rate: Number(item.rate),
      discountPercent: Number(item.discountPercent),
      taxRate: Number(item.taxRate),
    }));

    const totals = calculateQuotationTotals(orderItems as any);

    const orderData = {
      companyId: quotation.companyId,
      branchId: quotation.branchId,
      customerId: quotation.customerId,
      quotationId: quotation.id,
      orderNumber,
      orderDate: new Date(),
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'draft' as const,
      totalAmount: totals.totalAmount,
      totalTax: totals.totalTax,
      totalDiscount: totals.totalDiscount,
      netAmount: totals.netAmount,
      roundOff: totals.roundOff,
      grandTotal: totals.grandTotal,
      notes: `Converted from Quotation ${quotation.quotationNumber}`,
      createdBy: dto?.createdBy || null,
      items: quotation.items.map((item: any) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        discountPercent: Number(item.discountPercent),
        discountAmount: Number(item.discountAmount),
        amount: Number(item.amount),
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        netAmount: Number(item.netAmount),
      })),
    };

    const order = await prisma.salesOrder.create({
      data: {
        ...orderData,
        items: { createMany: { data: orderData.items } },
      },
      include: { items: true },
    });

    // Update quotation status
    await quotationRepository.updateQuotationStatus(id, companyId, 'converted');

    // Publish event
    const eventPayload: SalesQuotationConvertedEvent = {
      quotationId: quotation.id,
      orderId: order.id,
      customerId: quotation.customerId,
      companyId: quotation.companyId,
    };
    eventBus.publish('sales.quotation.converted', eventPayload);

    return order;
  }

  // ─── DELETE QUOTATION ───
  async deleteQuotation(id: string, companyId: string): Promise<void> {
    await quotationRepository.deleteQuotation(id, companyId);
  }
}

export const quotationService = new QuotationService();
