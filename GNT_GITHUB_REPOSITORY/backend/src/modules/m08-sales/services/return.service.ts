/**
 * M08 SALES & BILLING — Sales Return Service
 * Module: m08-sales | Team: B4-BRAVO
 *
 * 2026-09-12 — पहले `injectReturnDependencies()` कभी किसी भी module load path से
 * नहीं बुलाई जाती थी (grep-verified), इसलिए `postReturn` production में हमेशा
 * "M08 return dependencies are not fully wired" पर throw करता — कोई sales-return
 * कभी post हो ही नहीं सकता था (ठीक वही P0 जो 2026-09-06 को postInvoice में मिला
 * था, यहीं दोहराया रह गया)। अब असली M06/M09/M10 services सीधे — कोई DI गेट नहीं।
 */

import { SalesReturn } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import { returnRepository } from '../repositories/return.repository';
import { salesRepository } from '../repositories/sales.repository';
import {
  SalesReturnDTO,
  ReturnQueryParams,
  SalesReturnCreatedEvent,
} from '../types/sales.types';
import { calculateReturnTotals } from './sales.internal';
import { eventBus } from '../../../core/event-bus';
import { StockService } from '@/modules/m06-inventory';
import { InvoiceLedgerService } from '@/modules/m10-accounting';
import { gstService as m09GstService } from '@/modules/m09-gst';

const stockService = new StockService();
const invoiceLedgerService = new InvoiceLedgerService(prisma);

export class ReturnService {
  // ─── CREATE RETURN ───
  async createReturn(dto: SalesReturnDTO): Promise<SalesReturn> {
    const invoice = await salesRepository.getInvoiceById(dto.salesInvoiceId, dto.companyId);
    if (!invoice) throw new Error('Original sales invoice not found');

    const invoiceItemsByProduct = new Map(invoice.items.map((item: any) => [item.productId, item]));
    const normalizedItems = dto.items.map((item) => {
      const original = invoiceItemsByProduct.get(item.productId);
      if (!original) throw new Error(`Product ${item.productId} is not present on the original invoice`);
      if (Number(item.quantity) <= 0) throw new Error('Return quantity must be greater than 0');
      if (Number(item.quantity) > Number(original.quantity)) throw new Error(`Return quantity exceeds invoiced quantity for product ${item.productId}`);
      return { ...item, rate: Number(original.rate), taxRate: Number(original.taxRate), hsnCode: original.hsnCode || undefined };
    });
    const totals = calculateReturnTotals(normalizedItems);
    const returnNumber = dto.returnNumber || await returnRepository.getNextReturnNumber(dto.companyId);

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
  async getReturnById(id: string, companyId: string): Promise<SalesReturn & { items: any[] } | null> {
    return returnRepository.getReturnById(id, companyId);
  }

  // ─── APPROVE RETURN ───
  async approveReturn(id: string, companyId: string): Promise<SalesReturn> {
    const salesReturn = await returnRepository.getReturnById(id, companyId);
    if (!salesReturn) throw new Error('Return not found');
    if (salesReturn.status !== 'draft') throw new Error('Only draft returns can be approved');

    return returnRepository.updateReturnStatus(id, companyId, 'approved');
  }

  // ─── POST RETURN — stock add-back + GST reversal + M10 ledger reversal, फिर status ───
  async postReturn(id: string, companyId: string): Promise<SalesReturn> {
    const salesReturn = await returnRepository.getReturnById(id, companyId);
    if (!salesReturn) throw new Error('Return not found');
    if (salesReturn.status !== 'approved') throw new Error('Return must be approved before posting');

    const invoice = await salesRepository.getInvoiceById(salesReturn.salesInvoiceId, companyId);
    if (!invoice) throw new Error('Original invoice not found');

    // a. Stock add-back (M06) — असली, हर item real productId से
    for (const item of salesReturn.items as any[]) {
      await stockService.addStock(item.productId, Number(item.quantity), companyId, invoice.branchId, null, null, 'sales_return', id);
    }

    // b. M10 ledger reversal — फेल हो तो return 'approved' ही रहे, चुपचाप 'posted' न दिखे
    const ledgerResult = await invoiceLedgerService.postSalesReturn(companyId, id, undefined);
    if (!ledgerResult.posted && ledgerResult.reason !== 'already posted to ledger') {
      throw new Error(`M08→M10 sales-return ledger reversal failed: ${ledgerResult.reason}`);
    }

    // c. M09 GST reversal — negative gst_transaction row (GSTR sum में असली कटौती)
    try {
      await m09GstService.recordInvoiceTax({
        companyId,
        partyId: salesReturn.customerId,
        referenceType: 'sales_return',
        referenceId: id,
        transactionDate: salesReturn.returnDate,
        taxableAmount: -Number(salesReturn.totalAmount),
        totalTaxAmount: -Number(salesReturn.taxAmount),
        taxType: 'output',
      });
    } catch (e) {
      console.error(`[M08→M09] gst_transaction reversal failed for return ${id}:`, e);
    }

    await returnRepository.updateReturnStatus(id, companyId, 'posted');

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
