// ============================================================================
// M09 — E-Invoice routes असल में mount हैं और company की सीमा पकड़ते हैं (TEST_DB=1)
//
// पहले दो अलग गड़बड़ियाँ थीं:
// 1. EInvoiceController कहीं भी किसी route से जुड़ा ही नहीं था — पूरा feature
//    (generate/cancel/status/eway-bill) हमेशा 404 देता, frontend
//    (m09-gst/services/gst.service.ts) इसे /api/v1/gst/einvoice/generate पर
//    बुलाता था फिर भी।
// 2. invoiceId/irn सिर्फ़ पता होने भर से कोई भी company दूसरी company के sales
//    invoice पर असली सरकारी e-invoice बनवा सकती थी — company_id की जाँच थी ही नहीं।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

const DUSRI_COMPANY_ID = '00000000-0000-4000-8000-0000000009ee';

describe.runIf(process.env.TEST_DB === '1')('M09 — E-Invoice: mount + company की सीमा', () => {
  const dusriInvoiceId = randomUUID();

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: DUSRI_COMPANY_ID },
      update: {},
      create: { id: DUSRI_COMPANY_ID, name: 'Dusri Company M09', code: 'M09EINV' },
    });
    // दूसरी company का असली sales invoice — raw insert, ताकि M08 पर निर्भर न हों
    await prisma.$executeRaw`
      INSERT INTO sales_invoice (id, company_id, branch_id, customer_id, invoice_number, invoice_date, due_date, total_amount, total_tax, total_discount, net_amount, round_off, grand_total, updated_at)
      VALUES (${dusriInvoiceId}, ${DUSRI_COMPANY_ID}, ${randomUUID()}, ${randomUUID()}, ${'DUSRI-INV-1'}, NOW(), NOW(), 100, 0, 0, 100, 0, 100, NOW())
    `;
  });

  afterAll(async () => {
    await prisma.$executeRaw`DELETE FROM sales_invoice WHERE id = ${dusriInvoiceId}`;
    await prisma.company_master.deleteMany({ where: { id: DUSRI_COMPANY_ID } });
  });

  it('route mount है — 404 नहीं देता (auth चाहिए तो 401/400, गुम रास्ता नहीं)', async () => {
    const res = await request(app).post('/api/v1/gst/einvoice/generate').send({ invoice_id: randomUUID() });
    expect(res.status).not.toBe(404);
  });

  it('🔒 दूसरी company के invoice पर e-invoice नहीं बन सकता', async () => {
    const res = await request(app)
      .post('/api/v1/gst/einvoice/generate')
      .set('Authorization', mintBearer())
      .send({ invoice_id: dusriInvoiceId });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not found/i);

    const created = await prisma.e_invoice_record.findFirst({ where: { sales_invoice_id: dusriInvoiceId } });
    expect(created).toBeNull();
  });
});
