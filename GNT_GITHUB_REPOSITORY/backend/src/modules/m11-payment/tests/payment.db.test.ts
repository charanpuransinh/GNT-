// ============================================================================
// M11 — Payment DB-gated integration test (live PostgreSQL, TEST_DB=1)
//
// पूरा payment flow: method → payment → process → refund → approve,
// साथ में tenant-isolation (दूसरी company का data दिखे/छुए नहीं) की जाँच।
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, TEST_USER_ID, mintBearer } from '@/tests/helpers/auth';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000099';

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

describe.runIf(process.env.TEST_DB === '1')(
'M11 Payment — live DB', () => {
  let methodId = '';
  let paymentId = '';

  beforeAll(async () => {
    await registerModules();
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
    await prisma.company_master.upsert({
      where: { id: OTHER_COMPANY_ID },
      update: { name: 'Other Company' },
      create: { id: OTHER_COMPANY_ID, name: 'Other Company', code: 'OTHERCO' },
    });
    await cleanupTenant(TEST_COMPANY_ID);
    await cleanupTenant(OTHER_COMPANY_ID);
  });

  afterAll(async () => {
    await cleanupTenant(TEST_COMPANY_ID);
    await cleanupTenant(OTHER_COMPANY_ID);
  });

  it('बिना token GET /api/v1/payments → 401', async () => {
    const res = await request(app).get('/api/v1/payments');
    expect(res.status).toBe(401);
  });

  it('POST /api/v1/payments/methods → payment method बनता है', async () => {
    const res = await request(app)
      .post('/api/v1/payments/methods')
      .set('Authorization', mintBearer())
      .send({ name: 'UPI Test', type: 'UPI' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    methodId = res.body.data.id;
  });

  it('POST /api/v1/payments/transactions → payment बनता है', async () => {
    const res = await request(app)
      .post('/api/v1/payments/transactions')
      .set('Authorization', mintBearer())
      .send({ amount: '1500.50', paymentMethodId: methodId, payerName: 'Customer A' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING');
    paymentId = res.body.data.id;
  });

  it('POST /api/v1/payments/transactions/:id/process → COMPLETED होता है', async () => {
    const res = await request(app)
      .post(`/api/v1/payments/transactions/${paymentId}/process`)
      .set('Authorization', mintBearer())
      .send({ gatewayRef: 'GW-1' });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('ledger entries बनते हैं (double-entry)', async () => {
    const entries = await prisma.paymentLedgerEntry.findMany({ where: { tenantId: TEST_COMPANY_ID, transactionId: paymentId } });
    expect(entries.length).toBe(2);
  });

  it('POST /api/v1/payments/refunds → refund बनता है', async () => {
    const res = await request(app)
      .post('/api/v1/payments/refunds')
      .set('Authorization', mintBearer())
      .send({ transactionId: paymentId, amount: '500.00', reason: 'partial refund' });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('PENDING');
  });

  it('दूसरी company का payment दिखे नहीं (tenant isolation)', async () => {
    const res = await request(app)
      .get(`/api/v1/payments/transactions/${paymentId}`)
      .set('Authorization', mintBearer(OTHER_COMPANY_ID, TEST_USER_ID));
    expect(res.status).toBe(404);
  });

  it('दूसरी company payment delete न कर पाए (tenant isolation write)', async () => {
    const res = await request(app)
      .delete(`/api/v1/payments/transactions/${paymentId}`)
      .set('Authorization', mintBearer(OTHER_COMPANY_ID, TEST_USER_ID));
    // tenant A का payment tenant B delete नहीं कर सकता
    expect([404, 400]).toContain(res.status);
    const still = await prisma.paymentTransaction.findFirst({ where: { id: paymentId, tenantId: TEST_COMPANY_ID } });
    expect(still).not.toBeNull();
  });
});
