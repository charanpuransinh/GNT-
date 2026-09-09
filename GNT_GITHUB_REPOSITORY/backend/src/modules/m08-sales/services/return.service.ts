/**
 * M08 SALES & BILLING — Sales Return Service
 * Module: m08-sales | Team: B4-BRAVO
 */

import { prisma } from '@/common/config/prisma';
import { StockService } from '@/modules/m06-inventory';
import { InvoiceLedgerService } from '@/modules/m10-accounting';
import { SalesReturn } from '@prisma/client';
import { eventBus } from '../../../core/event-bus';
import { returnRepository } from '../repositories/return.repository';
import { salesRepository } from '../repositories/sales.repository';
import { ReturnQueryParams, SalesReturnCreatedEvent, SalesReturnDTO } from '../types/sales.types';
import { calculateReturnTotals, generateReturnNumber } from './sales.internal';

// audit 2026-09-09: injectDependencies() कभी wire नहीं होती थी → postReturn हमेशा
// 500 देता था (state mutate करने के *बाद*)। अब M06/M10 direct — endpoint असल में चलता है।
const returnLedger = new InvoiceLedgerService(prisma);
const returnStock = new StockService();

export class ReturnService {
  // ─── CREATE RETURN ───
  async createReturn(dto: SalesReturnDTO): Promise<SalesReturn> {
    const invoice = await salesRepository.getInvoiceById(dto.salesInvoiceId, dto.companyId);
    if (!invoice) throw new Error('Original sales invoice not found');

    const invoiceItemsByProduct = new Map(invoice.items.map((item: any) => [item.productId, item]));
    const normalizedItems = dto.items.map((item) => {
      const original = invoiceItemsByProduct.get(item.productId);
      if (!original)
        throw new Error(`Product ${item.productId} is not present on the original invoice`);
      if (Number(item.quantity) <= 0) throw new Error('Return quantity must be greater than 0');
      if (Number(item.quantity) > Number(original.quantity))
        throw new Error(`Return quantity exceeds invoiced quantity for product ${item.productId}`);
      return {
        ...item,
        rate: Number(original.rate),
        taxRate: Number(original.taxRate),
        hsnCode: original.hsnCode || undefined,
      };
    });
    const totals = calculateReturnTotals(normalizedItems);
    const returnNumber =
      dto.returnNumber || (await returnRepository.getNextReturnNumber(dto.companyId));

    const returnData = {
      companyId: dto.companyId,
      salesInvoiceId: dto.salesInvoiceId,
      customerId: dto.customerId,
      returnNumber,
      returnDate: new Date(dto.returnDate),
      totalAmount: totals.totalAmount,
      taxAmount: totals.totalTax,
      netAmount: totals.netAmount,
      reason: dto.reason || null,
      status: 'draft' as const,
      items: normalizedItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount),
        taxAmount: Number(item.taxAmount),
        netAmount: Number(item.netAmount),
      })),
    };

    return returnRepository.createReturn(returnData as any);
  }

  // ─── GET RETURNS ───
  async getReturns(params: ReturnQueryParams): Promise<{ data: SalesReturn[]; total: number }> {
    return returnRepository.getReturns(params);
  }

  // ─── GET RETURN BY ID ───
  async getReturnById(
    id: string,
    companyId: string
  ): Promise<(SalesReturn & { items: any[] }) | null> {
    return returnRepository.getReturnById(id, companyId);
  }

  // ─── APPROVE RETURN ───
  async approveReturn(id: string, companyId: string): Promise<SalesReturn> {
    const salesReturn = await returnRepository.getReturnById(id, companyId);
    if (!salesReturn) throw new Error('Return not found');
    if (salesReturn.status !== 'draft') throw new Error('Only draft returns can be approved');

    return returnRepository.updateReturnStatus(id, companyId, 'approved');
  }

  // ─── POST RETURN — real M06 stock add-back + M10 credit-note voucher, THEN status ───
  // (पहले: repository.postReturn() जो status पहले बदलता; फिर handlers जो throw करते —
  //  route हमेशा 500, DB half-mutated। अब: side-effects पहले, status बाद में — M08
  //  postInvoice जैसा ही सिद्धांत।)
  async postReturn(id: string, companyId: string, userId?: string): Promise<SalesReturn> {
    const salesReturn = await returnRepository.getReturnById(id, companyId);
    if (!salesReturn) throw new Error('Return not found');
    if (salesReturn.status !== 'approved')
      throw new Error('Return must be approved before posting');

    const invoice = await salesRepository.getInvoiceById(salesReturn.salesInvoiceId, companyId);
    if (!invoice) throw new Error('Original invoice not found');

    // 1. M10 credit-note voucher (sales-invoice accrual का उल्टा)। fatal error →
    //    propagate (return 'approved' ही रहे, ईमानदार failure)। "already posted" → आगे बढ़ो।
    const ledger = await returnLedger.postSalesReturn(companyId, id, userId);

    // 2. M06 — हर item का stock वापस (real avg-price update, movement log)
    for (const item of salesReturn.items as Array<{
      productId: string;
      quantity: unknown;
      rate: unknown;
    }>) {
      await returnStock.addStock(
        item.productId,
        Number(item.quantity),
        companyId,
        invoice.branchId,
        null,
        Number(item.rate) || null,
        'SALES_RETURN',
        id
      );
    }

    // 3. status → posted
    await prisma.salesReturn.update({ where: { id }, data: { status: 'posted' } });

    // Publish event
    const eventPayload: SalesReturnCreatedEvent = {
      returnId: salesReturn.id,
      invoiceId: salesReturn.salesInvoiceId,
      customerId: salesReturn.customerId,
      netAmount: Number(salesReturn.netAmount),
      companyId: salesReturn.companyId,
    };
    await eventBus.publish('sales.return.created', eventPayload);

    return returnRepository.getReturnById(id, companyId) as Promise<any>;
  }
}

export const returnService = new ReturnService();
