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

  // पहले: सिर्फ़ { name, email, roleId } माँगता था और सीधे `passwordHash` की उम्मीद
  // करता था — user_master.username/password_hash NOT NULL हैं, कोई caller भरता ही
  // नहीं था, इसलिए यह रास्ता हमेशा फटता था और role_ids कभी असाइन ही नहीं होता था।
  describe('POST /api/v1/company/users', () => {
    afterAll(async () => {
      await prisma.user_role.deleteMany({ where: { user_master: { company_id: TEST_COMPANY_ID, username: { in: ['newstaff', 'sneaky'] } } } });
      await prisma.user_master.deleteMany({ where: { company_id: TEST_COMPANY_ID, username: { in: ['newstaff', 'sneaky'] } } });
    });

    it('creates a real, loginable user and assigns the requested role', async () => {
      const ownerRole = await prisma.role_master.findFirstOrThrow({ where: { company_id: TEST_COMPANY_ID, name: 'Owner' } });

      const res = await request(app).post('/api/v1/company/users').set('Authorization', mintBearer()).send({
        username: 'newstaff',
        password: 'correct horse battery staple',
        name: 'New Staff',
        email: 'newstaff@test.com',
        role_ids: [ownerRole.id],
      });

      expect(res.status).toBe(201);
      expect(res.body.data.username).toBe('newstaff');

      const row = await prisma.user_master.findUnique({ where: { id: res.body.data.id } });
      expect(row?.password_hash).toBeTruthy();
      expect(row?.password_hash).not.toBe('correct horse battery staple');

      const assigned = await prisma.user_role.findFirst({ where: { user_id: res.body.data.id, role_id: ownerRole.id } });
      expect(assigned).not.toBeNull();
    });

    it('rejects a role_id from another company (and does not leave an orphan user behind)', async () => {
      const otherCompanyId = '00000000-0000-4000-8000-0000000009aa';
      await prisma.role_master.deleteMany({ where: { company_id: otherCompanyId, name: 'Foreign Role' } });
      await prisma.company_master.upsert({
        where: { id: otherCompanyId },
        update: {},
        create: { id: otherCompanyId, name: 'Other Company', code: 'OTHERCO' },
      });
      const foreignRole = await prisma.role_master.create({
        data: { company_id: otherCompanyId, name: 'Foreign Role', is_system_role: false },
      });

      try {
        const res = await request(app).post('/api/v1/company/users').set('Authorization', mintBearer()).send({
          username: 'sneaky',
          password: 'correct horse battery staple',
          name: 'Sneaky',
          email: 'sneaky@test.com',
          role_ids: [foreignRole.id],
        });

        expect(res.status).toBe(400);
        // असली जाँच: rejection के बावजूद कहीं user बन तो नहीं गया (पहले roleId की
        // जाँच user बनाने के **बाद** होती थी — orphan account छोड़ जाती थी)
        const orphan = await prisma.user_master.findFirst({ where: { company_id: TEST_COMPANY_ID, username: 'sneaky' } });
        expect(orphan).toBeNull();
      } finally {
        await prisma.role_master.delete({ where: { id: foreignRole.id } });
        await prisma.company_master.delete({ where: { id: otherCompanyId } });
      }
    });
  });
});
