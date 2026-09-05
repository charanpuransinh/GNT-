// ============================================================================
// M11 ↔ M10 (Accounting) और M11 ↔ M05 (Party) — असली wiring, असली DB पर
//
// पहले M11 का payment.completed पूरी तरह M10 से कटा हुआ था: अपनी private
// PaymentLedgerEntry table में hardcoded account codes ('CASH_BANK',
// 'SALES_REVENUE' — दिशा चाहे जो हो) लिखता था, M10 का असली ledger/voucher/
// account_master/sales_invoice.amountPaid कभी नहीं छूता था। partyId भी
// M05 में असली party है या नहीं, कभी जाँचा नहीं जाता था। direction हमेशा
// 'OUT' hardcode था — customer का receipt भी 'OUT' दर्ज होता।
//
// यह file साबित करती है: असली HTTP कॉल से payment बनाकर process करने पर —
//   1. M10 में असली voucher + ledger entries + voucher_allocation बनते हैं
//   2. sales_invoice.amountPaid/paymentStatus सच में अपडेट होता है
//   3. bank account का balance सही दिशा में बदलता है (receipt पर बढ़े, payment पर घटे)
//   4. ग़लत/मौजूद-न-हो party id पर payment बनना 400 पर रुकता है (M05 जाँच)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M11 ↔ M10/M05 — असली wiring', () => {
  const branchId = randomUUID();
  let customerId = '';
  let supplierId = '';
  let salesInvoiceId = '';
  let purchaseInvoiceId = '';
  let bankAccountId = '';
  let paymentMethodId = '';
  const stamp = Date.now();

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: {},
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });

    const customer = await prisma.party_master.create({
      data: { company_id: TEST_COMPANY_ID, party_type: 'customer', name: `M11-ग्राहक-${stamp}` },
    });
    customerId = customer.id;

    const supplier = await prisma.party_master.create({
      data: { company_id: TEST_COMPANY_ID, party_type: 'supplier', name: `M11-सप्लायर-${stamp}` },
    });
    supplierId = supplier.id;

    const salesInvoice = await prisma.salesInvoice.create({
      data: {
        companyId: TEST_COMPANY_ID, branchId, customerId,
        invoiceNumber: `M11-SI-${stamp}`,
        invoiceDate: new Date('2026-01-10'), dueDate: new Date('2026-02-10'),
        totalAmount: 1000, totalTax: 0, totalDiscount: 0, netAmount: 1000,
        roundOff: 0, grandTotal: 1000,
      },
    });
    salesInvoiceId = salesInvoice.id;

    const purchaseInvoice = await prisma.purchase_invoice.create({
      data: {
        company_id: TEST_COMPANY_ID, branch_id: branchId, supplier_id: supplierId,
        invoice_number: `M11-PI-${stamp}`,
        invoice_date: new Date('2026-01-10'),
        grand_total: 800,
      },
    });
    purchaseInvoiceId = purchaseInvoice.id;

    const bank = await prisma.bankAccount.create({
      data: {
        accountCode: `M11-TEST-BANK-${stamp}`, accountName: 'M11 Test Bank',
        bankName: 'Test Bank', accountNumber: '000111222', accountType: 'CURRENT',
        openingBalance: 5000, currentBalance: 5000, tenantId: TEST_COMPANY_ID,
      },
    });
    bankAccountId = bank.id;

    const method = await prisma.paymentMethod.create({
      data: { code: `M11-TEST-UPI-${stamp}`, name: 'UPI', tenantId: TEST_COMPANY_ID, createdBy: 'test', updatedBy: 'test' },
    });
    paymentMethodId = method.id;
  }, 60_000);

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({ where: { tenantId: TEST_COMPANY_ID, paymentMethodId } });
    await prisma.paymentMethod.deleteMany({ where: { id: paymentMethodId } });
    await prisma.bankAccount.deleteMany({ where: { id: bankAccountId } });
    await prisma.voucher_allocation.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.ledger.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.voucher.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.salesInvoice.deleteMany({ where: { id: salesInvoiceId } });
    await prisma.purchase_invoice.deleteMany({ where: { id: purchaseInvoiceId } });
    await prisma.party_master.deleteMany({ where: { id: { in: [customerId, supplierId] } } });
  });

  it('🔒 मौजूद न होने वाली party पर payment नहीं बनता (M05 जाँच)', async () => {
    const res = await request(app).post('/api/v1/payments/transactions').set('Authorization', mintBearer()).send({
      amount: '100',
      paymentMethodId,
      payerType: 'customer',
      payerId: randomUUID(), // कोई असली party नहीं
      payerName: 'Ghost',
    });
    expect(res.status).toBe(400);
  });

  it('CUSTOMER receipt: process होते ही M10 में असली voucher बनता है, invoice paid होता है, bank बढ़ता है', async () => {
    const create = await request(app).post('/api/v1/payments/transactions').set('Authorization', mintBearer()).send({
      amount: '1000',
      paymentMethodId,
      bankAccountId,
      invoiceId: salesInvoiceId,
      payerType: 'customer', // frontend jaisa lowercase — normalize होना चाहिए
      payerId: customerId,
      payerName: 'M11 ग्राहक',
    });
    expect(create.status).toBe(201);
    expect(create.body.data.status).toBe('PENDING');
    const paymentId = create.body.data.id;

    // direction सच में 'IN' दर्ज हुई (पहले हमेशा 'OUT' होती थी)
    const rowBeforeProcess = await prisma.paymentTransaction.findUnique({ where: { id: paymentId } });
    expect(rowBeforeProcess?.direction).toBe('IN');
    expect(rowBeforeProcess?.partyType).toBe('CUSTOMER');
    expect(rowBeforeProcess?.referenceType).toBe('INVOICE');

    const process = await request(app).post(`/api/v1/payments/transactions/${paymentId}/process`).set('Authorization', mintBearer()).send({});
    expect(process.status).toBe(200);
    expect(process.body.data.status).toBe('COMPLETED');
    expect(process.body.data.ledgerPosting?.posted).toBe(true);

    // M10 — असली voucher बना, party से जुड़ा
    const voucher = await prisma.voucher.findFirst({ where: { company_id: TEST_COMPANY_ID, voucher_type: 'receipt' }, include: { items: true, allocations: true } });
    expect(voucher).not.toBeNull();
    expect(Number(voucher!.total_debit)).toBe(1000);
    expect(voucher!.allocations.some((a) => a.reference_id === salesInvoiceId && Number(a.allocated_amount) === 1000)).toBe(true);

    // M10 — असली ledger entries, party-scoped
    const ledgerRows = await prisma.ledger.findMany({ where: { voucher_id: voucher!.id } });
    expect(ledgerRows.length).toBe(2);
    expect(ledgerRows.some((r) => r.party_id === customerId)).toBe(true);

    // M08 का असली sales invoice अब paid है
    const invoice = await prisma.salesInvoice.findUnique({ where: { id: salesInvoiceId } });
    expect(Number(invoice?.amountPaid)).toBe(1000);
    expect(invoice?.paymentStatus).toBe('paid');

    // bank balance बढ़ा (receipt)
    const bank = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    expect(Number(bank?.currentBalance)).toBe(6000); // 5000 + 1000

    // M10 का account_master अपने-आप बना (bank + Sundry Debtors control account)
    const bankLedgerAcc = await prisma.account_master.findFirst({ where: { company_id: TEST_COMPANY_ID, code: { startsWith: 'M11-BANK-' } } });
    expect(bankLedgerAcc).not.toBeNull();
    const arAcc = await prisma.account_master.findFirst({ where: { company_id: TEST_COMPANY_ID, code: `M11-AR-${TEST_COMPANY_ID}` } });
    expect(arAcc?.name).toBe('Sundry Debtors');
  });

  it('VENDOR payment: process होते ही bank घटता है (direction OUT सही)', async () => {
    const create = await request(app).post('/api/v1/payments/transactions').set('Authorization', mintBearer()).send({
      amount: '300',
      paymentMethodId,
      bankAccountId,
      invoiceId: purchaseInvoiceId,
      payerType: 'supplier', // 'VENDOR' का alias — normalize होना चाहिए
      payerId: supplierId,
      payerName: 'M11 सप्लायर',
    });
    expect(create.status).toBe(201);
    const paymentId = create.body.data.id;

    const rowBeforeProcess = await prisma.paymentTransaction.findUnique({ where: { id: paymentId } });
    expect(rowBeforeProcess?.direction).toBe('OUT');
    expect(rowBeforeProcess?.partyType).toBe('VENDOR');
    expect(rowBeforeProcess?.referenceType).toBe('BILL');

    const bankBefore = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });

    const process = await request(app).post(`/api/v1/payments/transactions/${paymentId}/process`).set('Authorization', mintBearer()).send({});
    expect(process.status).toBe(200);
    expect(process.body.data.ledgerPosting?.posted).toBe(true);

    const bankAfter = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    expect(Number(bankAfter?.currentBalance)).toBe(Number(bankBefore?.currentBalance) - 300);

    const voucher = await prisma.voucher.findFirst({ where: { company_id: TEST_COMPANY_ID, voucher_type: 'payment' } });
    expect(voucher).not.toBeNull();
  });
});
