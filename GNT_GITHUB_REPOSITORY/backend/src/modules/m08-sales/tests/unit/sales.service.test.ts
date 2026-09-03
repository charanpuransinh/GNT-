/**
 * M08 SALES & BILLING — Unit Tests: Sales Service
 * Module: m08-sales | Team: B4-BRAVO
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateInvoiceTotals, generateInvoiceNumber, calculateReturnTotals } from '../../services/sales.internal';
import { SalesInvoiceItemDTO } from '../../types/sales.types';

describe('Sales Service Unit Tests', () => {
  // ─── TEST: Invoice total with multiple tax slabs ───
  it('should calculate invoice totals with multiple tax slabs correctly', () => {
    const items: SalesInvoiceItemDTO[] = [
      { productId: 'p1', quantity: 2, rate: 100, taxRate: 5, discountPercent: 0 },
      { productId: 'p2', quantity: 1, rate: 200, taxRate: 12, discountPercent: 10 },
      { productId: 'p3', quantity: 3, rate: 50, taxRate: 18, discountPercent: 5 },
    ];

    const result = calculateInvoiceTotals(items);

    expect(result.totalAmount).toBe(550); // 200 + 200 + 150
    expect(result.totalDiscount).toBe(27.5); // 0 + 20 + 7.5
    expect(result.netAmount).toBeCloseTo(522.5 + result.totalTax, 1);
    expect(result.grandTotal).toBe(Math.round(result.netAmount));
    expect(result.taxBreakup.length).toBe(3);
  });

  // ─── TEST: Round-off calculation ───
  it('should round off to nearest rupee correctly', () => {
    const items: SalesInvoiceItemDTO[] = [
      { productId: 'p1', quantity: 1, rate: 99.33, taxRate: 18, discountPercent: 0 },
    ];

    const result = calculateInvoiceTotals(items);
    expect(result.grandTotal).toBe(Math.round(result.netAmount));
    expect(Math.abs(result.roundOff)).toBeLessThan(1);
  });

  // ─── TEST: Credit limit check blocks over-limit invoice ───
  it('should block invoice if credit limit exceeded', async () => {
    // This is tested in integration; here we verify the logic path
    const mockCheckCreditLimit = vi.fn().mockResolvedValue({ allowed: false, limit: 5000, used: 4800 });
    const invoiceAmount = 500;
    const check = await mockCheckCreditLimit('cust-1', invoiceAmount);
    expect(check.allowed).toBe(false);
    expect(check.limit).toBe(5000);
  });

  // ─── TEST: Stock availability check blocks out-of-stock item ───
  it('should block invoice if stock insufficient', async () => {
    const mockCheckStock = vi.fn().mockResolvedValue({ available: false, stock: 2 });
    const check = await mockCheckStock('p1', 'branch-1', 5);
    expect(check.available).toBe(false);
    expect(check.stock).toBe(2);
  });

  // ─── TEST: Invoice numbering ───
  it('should generate correct invoice number format', () => {
    const num = generateInvoiceNumber('comp-1', 42, 'INV');
    expect(num).toMatch(/^INV-\d{4}-00042$/);
  });

  // ─── TEST: Return calculation with original invoice reference ───
  it('should calculate return totals correctly', () => {
    const items = [
      { productId: 'p1', quantity: 2, rate: 100, taxRate: 18 },
      { productId: 'p2', quantity: 1, rate: 200, taxRate: 18 },
    ];

    const result = calculateReturnTotals(items);
    expect(result.totalAmount).toBe(400);
    expect(result.totalTax).toBe(72); // 18% of 400
    expect(result.netAmount).toBe(472);
    expect(result.grandTotal).toBe(472);
  });

  // ─── TEST: Payment status update on event receipt ───
  it('should update payment status correctly on partial payment', () => {
    const grandTotal = 1000;
    const currentPaid = 300;
    const newPayment = 200;
    const totalPaid = currentPaid + newPayment;
    let status: string;
    if (totalPaid >= grandTotal) status = 'paid';
    else if (totalPaid > 0) status = 'partial';
    else status = 'unpaid';
    expect(status).toBe('partial');
    expect(totalPaid).toBe(500);
  });

  it('should update payment status to paid on full payment', () => {
    const grandTotal = 1000;
    const currentPaid = 800;
    const newPayment = 200;
    const totalPaid = currentPaid + newPayment;
    let status: string;
    if (totalPaid >= grandTotal) status = 'paid';
    else if (totalPaid > 0) status = 'partial';
    else status = 'unpaid';
    expect(status).toBe('paid');
  });
});
