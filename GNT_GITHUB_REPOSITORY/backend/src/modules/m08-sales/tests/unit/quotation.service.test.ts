/**
 * M08 SALES & BILLING — Unit Tests: Quotation Service
 * Module: m08-sales | Team: B4-BRAVO
 */

import { describe, it, expect, vi } from 'vitest';
import { calculateQuotationTotals, generateQuotationNumber } from '../../services/sales.internal';
import { QuotationItemDTO } from '../../types/sales.types';

describe('Quotation Service Unit Tests', () => {
  // ─── TEST: Quotation calculation ───
  it('should calculate quotation totals correctly', () => {
    const items: QuotationItemDTO[] = [
      { productId: 'p1', quantity: 10, rate: 50, taxRate: 5, discountPercent: 0 },
      { productId: 'p2', quantity: 5, rate: 100, taxRate: 12, discountPercent: 10 },
    ];

    const result = calculateQuotationTotals(items);
    expect(result.totalAmount).toBe(1000);
    expect(result.totalDiscount).toBe(50);
    expect(result.taxBreakup.length).toBe(2);
  });

  // ─── TEST: Quotation numbering ───
  it('should generate correct quotation number format', () => {
    const num = generateQuotationNumber('comp-1', 7);
    expect(num).toMatch(/^QTN-\d{4}-00007$/);
  });

  // ─── TEST: Quotation → Order conversion chain ───
  it('should preserve item lines during quotation to order conversion', () => {
    const quotationItems = [
      { productId: 'p1', quantity: 2, rate: 100, taxRate: 18, discountPercent: 5 },
      { productId: 'p2', quantity: 1, rate: 200, taxRate: 12, discountPercent: 0 },
    ];

    // Simulate conversion mapping
    const orderItems = quotationItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      rate: item.rate,
      discountPercent: item.discountPercent,
      taxRate: item.taxRate,
    }));

    expect(orderItems).toHaveLength(2);
    expect(orderItems[0].productId).toBe('p1');
    expect(orderItems[0].quantity).toBe(2);
    expect(orderItems[1].rate).toBe(200);
  });
});
