import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import request from 'supertest';
import { app, registerModules } from '../../../../app';
import { prisma } from '@/common/config/prisma';
import { TEST_COMPANY_ID, mintBearer } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')(
'M04 Company Integration', () => {
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

  describe('GET /api/v1/company/profile', () => {
    it('returns 200 with profile', async () => {
      const res = await request(app).get('/api/v1/company/profile').set('Authorization', mintBearer());
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    it('returns 401 without auth', async () => {
      const res = await request(app).get('/api/v1/company/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/v1/company/branches', () => {
    it('creates branch', async () => {
      const res = await request(app).post('/api/v1/company/branches').set('Authorization', mintBearer()).send({ name: 'Main Godown' });
      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('id');
    });
  });
});
