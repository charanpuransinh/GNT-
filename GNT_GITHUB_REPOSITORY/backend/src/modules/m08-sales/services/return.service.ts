/**
 * M08 SALES & BILLING — Sales Return Service
 * Module: m08-sales | Team: B4-BRAVO
 */

import { PrismaClient, SalesReturn } from '@prisma/client';
import { returnRepository } from '../repositories/return.repository';
import { salesRepository } from '../repositories/sales.repository';
import {
  SalesReturnDTO,
  ReturnQueryParams,
  SalesReturnCreatedEvent,
} from '../types/sales.types';
import { calculateReturnTotals, generateReturnNumber } from './sales.internal';
import { eventBus } from '../../../core/event-bus';

const prisma = new PrismaClient();

interface StockService {
  addBackStock(items: Array<{ productId: string; quantity: number }>, branchId: string): Promise<void>;
}
interface GstService {
  calculateTax(items: Array<{ hsnCode: string; amount: number; taxRate: number }>, customerState: string, companyState: string): Promise<any>;
}
interface LedgerService {
  createEntry(entry: any): Promise<void>;
}
interface PartyService {
  getCustomerById(id: string): Promise<any>;
}
// टास्क #007 Step 4 — company M04 की चीज़ है, M05 से नहीं
interface CompanyService {
  getProfile(companyId: string): Promise<any>;
}

let stockService: StockService;
let gstService: GstService;
let ledgerService: LedgerService;
let partyService: PartyService;
let companyService: CompanyService;

export function injectReturnDependencies(deps: {
  stockService: StockService;
  gstService: GstService;
  ledgerService: LedgerService;
  partyService: PartyService;
  companyService: CompanyService;
}) {
  stockService = deps.stockService;
  gstService = deps.gstService;
  ledgerService = deps.ledgerService;
  partyService = deps.partyService;
  companyService = deps.companyService;
}

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

  // ─── POST RETURN (ATOMIC — triggers stock add-back + GST reversal + ledger reversal) ───
  async postReturn(id: string, companyId: string): Promise<SalesReturn> {
    const salesReturn = await returnRepository.getReturnById(id, companyId);
    if (!salesReturn) throw new Error('Return not found');
    if (salesReturn.status !== 'approved') throw new Error('Return must be approved before posting');

    const invoice = await salesRepository.getInvoiceById(salesReturn.salesInvoiceId, companyId);
    if (!invoice) throw new Error('Original invoice not found');

    if (!stockService || !gstService || !ledgerService || !partyService || !companyService) throw new Error('M08 return dependencies are not fully wired');
    const customer = await partyService.getCustomerById(invoice.customerId);
    const company = await companyService.getProfile(invoice.companyId);
    if (!customer || !company) throw new Error('Customer or company master data not found');

    await prisma.$transaction(async (tx) => {
      // a. Add back stock (M06)
      if (stockService) {
        const stockItems = salesReturn.items.map((i: any) => ({
          productId: i.productId,
          quantity: Number(i.quantity),
        }));
        await stockService.addBackStock(stockItems, invoice.branchId);
      }

      // b. GST reversal (M09)
      if (gstService) {
        const invoiceItemsByProduct = new Map(invoice.items.map((i: any) => [i.productId, i]));
        const gstItems = salesReturn.items.map((i: any) => {
          const original = invoiceItemsByProduct.get(i.productId);
          if (!original) throw new Error(`Original invoice item not found for product ${i.productId}`);
          return { hsnCode: original.hsnCode || '', amount: Number(i.amount), taxRate: Number(original.taxRate) };
        });
        await gstService.calculateTax(gstItems, customer.state, company.state);
      }

      // c. Ledger reversal (M10)
      if (ledgerService) {
        await ledgerService.createEntry({
          returnId: salesReturn.id,
          customerId: salesReturn.customerId,
          amount: Number(salesReturn.netAmount),
          type: 'SALES_RETURN',
          date: new Date(),
        });
      }

      // d. Update return status
      await tx.salesReturn.update({
        where: { id },
        data: { status: 'posted' },
      });
    });

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
