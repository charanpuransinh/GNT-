// ============================================================================
// M07 PURCHASE MANAGEMENT — PUBLIC Purchase Service
// Provides: createPurchaseInvoice, getPurchaseInvoices, approvePurchaseInvoice
// ============================================================================

import { PrismaClient } from '@prisma/client';
import { PurchaseRepository } from '../repositories/purchase.repository';
import { calculateInvoiceTotals, calculateReturnTotals, numberToWords } from './purchase.internal';
import { OCRService, TesseractOCRProvider } from './ocr.service';
import { PurchaseEventHandlers } from '../events/purchase.handlers';
import { PURCHASE_EVENTS } from '../events/purchase.events';
import {
  CreatePurchaseInvoiceDTO,
  UpdatePurchaseInvoiceDTO,
  PurchaseInvoiceQueryDTO,
  CreatePurchaseReturnDTO,
  PurchaseInvoiceApprovedEvent,
  OCRResultDTO,
  OCRReviewDTO,
} from '../types/purchase.types';

export class PurchaseService {
  private repository: PurchaseRepository;
  private ocrService: OCRService;

  constructor(
    private prisma: PrismaClient,
    private eventHandlers: PurchaseEventHandlers,
    private eventBus: { publish: (event: string, payload: unknown) => Promise<void> },
  ) {
    this.repository = new PurchaseRepository(prisma);
    this.ocrService = new OCRService(new TesseractOCRProvider(process.env.TESSERACT_BIN || 'tesseract'));
  }

  // ─── PUBLIC API: createPurchaseInvoice ───
  async createPurchaseInvoice(dto: CreatePurchaseInvoiceDTO) {
    const calc = calculateInvoiceTotals(dto.items, dto.round_off || 0);

    const enrichedItems = dto.items.map((item, idx) => ({
      ...item,
      amount: calc.items[idx].amount,
      discount_amount: calc.items[idx].discount_amount,
      tax_amount: calc.items[idx].tax_amount,
      net_amount: calc.items[idx].net_amount,
    }));

    const invoice = await this.repository.createInvoice({
      ...dto,
      items: enrichedItems,
      total_amount: calc.total_amount,
      total_tax: calc.total_tax,
      total_discount: calc.total_discount,
      net_amount: calc.net_amount,
      grand_total: calc.grand_total,
    });

    return {
      ...invoice,
      amount_in_words: numberToWords(calc.grand_total),
    };
  }

  // ─── PUBLIC API: getPurchaseInvoices ───
  async getPurchaseInvoices(query: PurchaseInvoiceQueryDTO) {
    return this.repository.getInvoices(query);
  }

  async getPurchaseInvoiceById(id: string, company_id: string) {
    const invoice = await this.repository.getInvoiceById(id, company_id);
    if (!invoice) throw new Error('Purchase invoice not found');
    return {
      ...invoice,
      amount_in_words: invoice.grand_total ? numberToWords(Number(invoice.grand_total)) : null,
    };
  }

  async updatePurchaseInvoice(id: string, company_id: string, dto: UpdatePurchaseInvoiceDTO) {
    const existing = await this.repository.getInvoiceById(id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be updated');

    let calc;
    let enrichedItems;
    if (dto.items && dto.items.length > 0) {
      calc = calculateInvoiceTotals(dto.items, dto.round_off || Number(existing.round_off) || 0);
      enrichedItems = dto.items.map((item, idx) => ({
        ...item,
        amount: calc.items[idx].amount,
        discount_amount: calc.items[idx].discount_amount,
        tax_amount: calc.items[idx].tax_amount,
        net_amount: calc.items[idx].net_amount,
      }));
    }

    const updateData = enrichedItems 
      ? { ...dto, items: enrichedItems, total_amount: calc!.total_amount, total_tax: calc!.total_tax, total_discount: calc!.total_discount, net_amount: calc!.net_amount, grand_total: calc!.grand_total }
      : dto;

    return this.repository.updateInvoice(id, company_id, updateData);
  }

  async deletePurchaseInvoice(id: string, company_id: string) {
    const existing = await this.repository.getInvoiceById(id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be deleted');
    return this.repository.deleteInvoice(id, company_id);
  }

  // ─── PUBLIC API: approvePurchaseInvoice ───
  async approvePurchaseInvoice(id: string, company_id: string, approved_by: string) {
    const existing = await this.repository.getInvoiceById(id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');
    if (existing.status !== 'draft') throw new Error('Only draft invoices can be approved');

    const result = await this.repository.approveInvoice(id, company_id, approved_by);
    if (result.count === 0) throw new Error('Failed to approve invoice');

    // Publish event
    const eventPayload: PurchaseInvoiceApprovedEvent = {
      invoice_id: id,
      supplier_id: existing.supplier_id,
      company_id,
      total_amount: Number(existing.total_amount) || 0,
      tax_amount: Number(existing.total_tax) || 0,
      grand_total: Number(existing.grand_total) || 0,
      items: existing.items.map(item => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount) || 0,
        tax_amount: Number(item.tax_amount) || 0,
        net_amount: Number(item.net_amount) || 0,
      })),
      approved_at: new Date(),
      approved_by,
    };

    await this.eventBus.publish(PURCHASE_EVENTS.INVOICE_APPROVED, eventPayload);
    await this.eventHandlers.handleInvoiceApproved({
      event: PURCHASE_EVENTS.INVOICE_APPROVED,
      payload: eventPayload,
      timestamp: new Date(),
      source: 'm07-purchase',
      trace_id: `trace-${Date.now()}`,
    });

    return { success: true, message: 'Invoice approved successfully' };
  }

  async postPurchaseInvoice(id: string, company_id: string, posted_by: string) {
    const existing = await this.repository.getInvoiceById(id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');
    if (existing.status !== 'approved') throw new Error('Invoice must be approved before posting');

    // Execute cross-module side effects while the invoice is still approved.
    // The status is changed only after all required effects succeed, preventing
    // a permanently-posted invoice when a dependent module fails.
    const eventPayload: PurchaseInvoiceApprovedEvent = {
      invoice_id: id,
      supplier_id: existing.supplier_id,
      company_id,
      total_amount: Number(existing.total_amount) || 0,
      tax_amount: Number(existing.total_tax) || 0,
      grand_total: Number(existing.grand_total) || 0,
      items: existing.items.map(item => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        amount: Number(item.amount) || 0,
        tax_amount: Number(item.tax_amount) || 0,
        net_amount: Number(item.net_amount) || 0,
      })),
      approved_at: existing.updated_at,
      approved_by: existing.approved_by || posted_by,
    };

    await this.eventHandlers.handleInvoicePosted({
      event: PURCHASE_EVENTS.INVOICE_POSTED,
      payload: eventPayload,
      timestamp: new Date(),
      source: 'm07-purchase',
      trace_id: `trace-${Date.now()}`,
    });

    const result = await this.repository.postInvoice(id, company_id, posted_by);
    if (result.count === 0) throw new Error('Failed to post invoice after side effects completed');

    await this.eventBus.publish(PURCHASE_EVENTS.INVOICE_POSTED, eventPayload);
    return { success: true, message: 'Invoice posted successfully — stock, GST, and ledger updated' };
  }

  async cancelPurchaseInvoice(id: string, company_id: string) {
    const existing = await this.repository.getInvoiceById(id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');
    if (existing.status === 'posted') throw new Error('Posted invoices cannot be cancelled — use purchase return instead');

    return this.repository.cancelInvoice(id, company_id);
  }

  // ─── OCR Operations ───

  async uploadOCR(id: string, company_id: string, imageBuffer: Buffer) {
    const existing = await this.repository.getInvoiceById(id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');

    const ocrResult = await this.ocrService.processImage(imageBuffer);
    await this.repository.updateOCRData(id, company_id, ocrResult, ocrResult.overall_confidence);

    return ocrResult;
  }

  async reviewOCR(dto: OCRReviewDTO, company_id: string) {
    const { invoice_id, action, ocr_data } = dto;
    if (!company_id) throw new Error('Company context is required');
    const existing = await this.repository.getInvoiceById(invoice_id, company_id);
    if (!existing) throw new Error('Purchase invoice not found');

    if (action === 'reject') {
      await this.repository.updateOCRData(invoice_id, company_id, null, 0);
      return { success: true, message: 'OCR data rejected' };
    }

    const validation = this.ocrService.validateOCRReview(ocr_data);
    if (!validation.valid) {
      throw new Error(`OCR validation failed: ${validation.errors.join(', ')}`);
    }

    // Update invoice with accepted OCR data
    await this.repository.updateOCRData(invoice_id, company_id, ocr_data, ocr_data.overall_confidence);

    return { success: true, message: 'OCR data accepted and saved' };
  }

  // ─── Purchase Return ───

  async createPurchaseReturn(dto: CreatePurchaseReturnDTO) {
    const calc = calculateReturnTotals(dto.items);
    const enrichedItems = dto.items.map((item) => {
      const amount = item.amount ?? item.quantity * item.rate;
      const tax_amount = item.tax_amount ?? 0;
      const net_amount = item.net_amount ?? amount + tax_amount;
      return { ...item, amount, tax_amount, net_amount };
    });

    return this.repository.createReturn({
      ...dto,
      items: enrichedItems,
      total_amount: calc.total_amount,
      tax_amount: calc.tax_amount,
      net_amount: calc.net_amount,
    });
  }

  async getPurchaseReturns(company_id: string, page?: number, limit?: number) {
    return this.repository.getReturns(company_id, page, limit);
  }

  async getPurchaseReturnById(id: string, company_id: string) {
    return this.repository.getReturnById(id, company_id);
  }

  async approvePurchaseReturn(id: string, company_id: string) {
    const existing = await this.repository.getReturnById(id, company_id);
    if (!existing) throw new Error('Purchase return not found');
    if (existing.status !== 'draft') throw new Error('Only draft returns can be approved');

    const result = await this.repository.approveReturn(id, company_id);
    if (result.count === 0) throw new Error('Failed to approve purchase return');
    return this.repository.getReturnById(id, company_id);
  }

  async postPurchaseReturn(id: string, company_id: string, posted_by: string) {
    const existing = await this.repository.getReturnById(id, company_id);
    if (!existing) throw new Error('Purchase return not found');
    if (existing.status !== 'approved') throw new Error('Purchase return must be approved before posting');

    const result = await this.repository.postReturn(id, company_id);
    if (result.count === 0) throw new Error('Failed to post purchase return');

    const eventPayload = {
      return_id: id,
      company_id,
      supplier_id: existing.supplier_id,
      total_amount: Number(existing.total_amount) || 0,
      tax_amount: Number(existing.tax_amount) || 0,
      items: existing.items.map(item => ({
        product_id: item.product_id,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        tax_amount: Number(item.tax_amount) || 0,
      })),
      posted_at: new Date(),
    };

    await this.eventHandlers.handleReturnPosted({
      event: PURCHASE_EVENTS.RETURN_POSTED,
      payload: eventPayload,
      timestamp: new Date(),
      source: 'm07-purchase',
      trace_id: `trace-${Date.now()}`,
    });
    await this.eventBus.publish(PURCHASE_EVENTS.RETURN_POSTED, eventPayload);
    return this.repository.getReturnById(id, company_id);
  }
}
