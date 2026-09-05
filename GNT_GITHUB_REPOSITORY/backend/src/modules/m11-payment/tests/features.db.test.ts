// ============================================================================
// M11 — Feature coverage (DB-gated): paymentMethod / bankAccount / refund / reconciliation
// (payment flow पहले से payment.db.test.ts में है — यहाँ बाक़ी 4 features)
// NOTE: parallel run में payment.db.test.ts से टकराव न हो, इसलिए अलग company-id।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const COMPANY_ID = '00000000-0000-4000-8000-000000000010';
const OTHER_ID = '00000000-0000-4000-8000-000000000011';
const auth = () => mintBearer(COMPANY_ID, TEST_USER_ID);
const authOther = () => mintBearer(OTHER_ID, TEST_USER_ID);

async function cleanupTenant(tenantId: string) {
  await prisma.paymentLedgerEntry.deleteMany({ where: { tenantId } });
  await prisma.refund.deleteMany({ where: { tenantId } });
  await prisma.paymentAllocation.deleteMany({ where: { tenantId } });
  await prisma.paymentTransaction.deleteMany({ where: { tenantId } });
  await prisma.paymentInstallment.deleteMany({ where: { tenantId } });
  await prisma.paymentSchedule.deleteMany({ where: { tenantId } });
  await prisma.paymentReconciliationItem.deleteMany({ where: { tenantId } });
  await prisma.paymentReconciliation.deleteMany({ where: { tenantId } });
  await prisma.paymentMethod.deleteMany({ where: { tenantId } });
  await prisma.bankAccount.deleteMany({ where: { tenantId } });
}

describe.runIf(process.env.TEST_DB === '1')('M11 features — live DB', () => {
  let methodId = '';
  let bankAccountId = '';
  let refundId = '';
  let reconciliationId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: COMPANY_ID },
      update: { name: 'Feat Company' },
      create: { id: COMPANY_ID, name: 'Feat Company', code: 'FEATCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_ID },
      update: { name: 'Feat Other' },
      create: { id: OTHER_ID, name: 'Feat Other', code: 'FEATOT' },
    });
    await cleanupTenant(COMPANY_ID);
    await cleanupTenant(OTHER_ID);
  });

  afterAll(async () => {
    await cleanupTenant(COMPANY_ID);
    await cleanupTenant(OTHER_ID);
  });

  it('paymentMethod: create → list → get → update → delete', async () => {
    const created = await request(app)
      .post('/api/v1/payments/methods')
      .set('Authorization', auth())
      .send({ name: 'UPI Feature', type: 'UPI' });
    expect(created.status).toBe(201);
    methodId = created.body.data.id;

    const list = await request(app).get('/api/v1/payments/methods').set('Authorization', auth());
    expect(list.status).toBe(200);
    expect(list.body.data.some((m: { id: string }) => m.id === methodId)).toBe(true);

    const one = await request(app).get(`/api/v1/payments/methods/${methodId}`).set('Authorization', auth());
    expect(one.status).toBe(200);
    expect(one.body.data.name).toBe('UPI Feature');

    const upd = await request(app)
      .patch(`/api/v1/payments/methods/${methodId}`)
      .set('Authorization', auth())
      .send({ name: 'UPI Feature v2' });
    expect(upd.status).toBe(200);
    expect(upd.body.data.name).toBe('UPI Feature v2');

    const del = await request(app).delete(`/api/v1/payments/methods/${methodId}`).set('Authorization', auth());
    expect(del.status).toBe(200);
  });

  it('bankAccount: create → list → tenant isolation', async () => {
    const created = await request(app)
      .post('/api/v1/payments/bank-accounts')
      .set('Authorization', auth())
      .send({ accountName: 'Current A/c', accountNumber: '1234567890', bankName: 'SBI', accountType: 'CURRENT' });
    expect(created.status).toBe(201);
    bankAccountId = created.body.data.id;

    const list = await request(app).get('/api/v1/payments/bank-accounts').set('Authorization', auth());
    expect(list.body.data.some((a: { id: string }) => a.id === bankAccountId)).toBe(true);

    const other = await request(app)
      .get(`/api/v1/payments/bank-accounts/${bankAccountId}`)
      .set('Authorization', authOther());
    expect(other.status).toBe(404);
  });

  it('refund: create → approve → list', async () => {
    const m = await request(app)
      .post('/api/v1/payments/methods')
      .set('Authorization', auth())
      .send({ name: 'UPI Refund', type: 'UPI' });
    expect(m.status).toBe(201);
    methodId = m.body.data.id;

    const pay = await request(app)
      .post('/api/v1/payments/transactions')
      .set('Authorization', auth())
      .send({ amount: '1000.00', paymentMethodId: methodId, payerName: 'Refundable' });
    expect(pay.status).toBe(201);
    const paymentId = pay.body.data.id;

    await request(app)
      .post(`/api/v1/payments/transactions/${paymentId}/process`)
      .set('Authorization', auth())
      .send({ gatewayRef: 'GW-REF' });

    const r = await request(app)
      .post('/api/v1/payments/refunds')
      .set('Authorization', auth())
      .send({ transactionId: paymentId, amount: '400.00', reason: 'partial' });
    expect(r.status).toBe(201);
    refundId = r.body.data.id;

    const approve = await request(app)
      .post(`/api/v1/payments/refunds/${refundId}/approve`)
      .set('Authorization', auth());
    expect(approve.status).toBe(200);

    const list = await request(app).get('/api/v1/payments/refunds').set('Authorization', auth());
    expect(list.body.data.some((x: { id: string }) => x.id === refundId)).toBe(true);
  });

  it('reconciliation: create → get → upload-statement → auto-match', async () => {
    const start = new Date(Date.now() - 86400000).toISOString();
    const end = new Date().toISOString();
    const created = await request(app)
      .post('/api/v1/payments/reconciliations')
      .set('Authorization', auth())
      .send({ bankAccountId, startDate: start, endDate: end });
    expect(created.status).toBe(201);
    reconciliationId = created.body.data.id;

    const one = await request(app)
      .get(`/api/v1/payments/reconciliations/${reconciliationId}`)
      .set('Authorization', auth());
    expect(one.status).toBe(200);

    const upload = await request(app)
      .post(`/api/v1/payments/reconciliations/${reconciliationId}/upload-statement`)
      .set('Authorization', auth())
      .send({ statementData: [{ date: '2026-01-02', description: 'credit', amount: '500', type: 'CREDIT' }] });
    expect(upload.status).toBe(200);

    const match = await request(app)
      .post(`/api/v1/payments/reconciliations/${reconciliationId}/auto-match`)
      .set('Authorization', auth());
    expect(match.status).toBe(200);
  });
});
