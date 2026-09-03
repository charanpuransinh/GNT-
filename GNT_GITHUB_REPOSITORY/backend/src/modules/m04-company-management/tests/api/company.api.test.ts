import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')(
'M04 API Contract', () => {
  beforeAll(async () => {
    await registerModules();
    await prisma.financial_year.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.branch_master.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.company_master.upsert({
      where: { id: TEST_COMPANY_ID },
      update: { name: 'Test Company' },
      create: { id: TEST_COMPANY_ID, name: 'Test Company', code: 'TESTCO' },
    });
  });

  afterAll(async () => {
    await prisma.financial_year.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
    await prisma.branch_master.deleteMany({ where: { company_id: TEST_COMPANY_ID } });
  });

  it('GET /profile matches schema', async () => {
    const res = await request(app).get('/api/v1/company/profile').set('Authorization', mintBearer());
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: expect.any(String), name: expect.any(String) });
  });

  it('POST /financial-years accepts valid FY', async () => {
    const res = await request(app).post('/api/v1/company/financial-years').set('Authorization', mintBearer()).send({
      startDate: '2026-04-01', endDate: '2027-03-31', prefix: 'FY26'
    });
    expect([200, 201]).toContain(res.status);
  });
});
