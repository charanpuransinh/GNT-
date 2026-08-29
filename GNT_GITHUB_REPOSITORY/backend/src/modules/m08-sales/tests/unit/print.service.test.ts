/**
 * M08 SALES & BILLING — Unit Tests: Print Service
 * Module: m08-sales | Team: B4-BRAVO
 */

import { describe, it, expect } from 'vitest';
import { printService } from '../../services/print.service';
import { PrintData } from '../../services/sales.internal';

describe('Print Service Unit Tests', () => {
  const mockPrintData: PrintData = {
    companyName: 'RAKSHA ENTERPRISES',
    companyAddress: '123 Main St, Mumbai',
    companyGstin: '27AABCU9603R1ZX',
    invoiceNumber: 'INV-2408-00001',
    invoiceDate: '24/08/2026',
    dueDate: '23/09/2026',
    customerName: 'ABC Traders',
    customerAddress: '456 Market Rd, Pune',
    customerGstin: '27AADCB2230M1Z3',
    items: [
      { sno: 1, description: 'Widget A', hsn: '8471', qty: 2, rate: 100, amount: 200, discount: 0, taxRate: 18, taxAmount: 36, netAmount: 236 },
      { sno: 2, description: 'Gadget B', hsn: '8473', qty: 1, rate: 150, amount: 150, discount: 10, taxRate: 12, taxAmount: 16.8, netAmount: 156.8 },
    ],
    totals: {
      totalAmount: 350,
      totalDiscount: 10,
      totalTax: 52.8,
      netAmount: 392.8,
      roundOff: 0.2,
      grandTotal: 393,
      taxBreakup: [
        { rate: 18, amount: 36, cgst: 18, sgst: 18, igst: 0 },
        { rate: 12, amount: 16.8, cgst: 8.4, sgst: 8.4, igst: 0 },
      ],
    },
    paymentMode: 'Cash',
    terms: 'Net 30 days',
    notes: 'Thank you for your business',
  };

  // ─── TEST: Thermal 2-inch template generation ───
  it('should generate valid thermal 2-inch HTML', () => {
    const html = printService.generateThermal2Inch(mockPrintData);
    expect(html).toContain('RAKSHA ENTERPRISES');
    expect(html).toContain('INV-2408-00001');
    expect(html).toContain('TAX INVOICE');
    expect(html).toContain('₹393.00');
    expect(html).toContain('58mm');
  });

  // ─── TEST: Thermal 3-inch template generation ───
  it('should generate valid thermal 3-inch HTML', () => {
    const html = printService.generateThermal3Inch(mockPrintData);
    expect(html).toContain('RAKSHA ENTERPRISES');
    expect(html).toContain('GSTIN: 27AABCU9603R1ZX');
    expect(html).toContain('80mm');
    expect(html).toContain('CGST @ 9%');
  });

  // ─── TEST: A4 template generation ───
  it('should generate valid A4 HTML', () => {
    const html = printService.generateA4(mockPrintData);
    expect(html).toContain('RAKSHA ENTERPRISES');
    expect(html).toContain('TAX INVOICE');
    expect(html).toContain('A4');
    expect(html).toContain('Authorized Signature');
    expect(html).toContain('Amount in words');
  });

  // ─── TEST: Template selector ───
  it('should select correct template based on type', () => {
    const html2 = printService.generatePrint('thermal-2inch', mockPrintData);
    const html3 = printService.generatePrint('thermal-3inch', mockPrintData);
    const htmlA4 = printService.generatePrint('a4', mockPrintData);

    expect(html2).toContain('58mm');
    expect(html3).toContain('80mm');
    expect(htmlA4).toContain('A4');
  });
});
