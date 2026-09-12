// ============================================================================
// M29 — Mobile Auth & Push — real DB + real HTTP wiring
//
// Mounted 2026-09-13 at /api/v1/mobile (module-registry.ts). Verifies the
// module is actually reachable over HTTP (audit finding: real+DB-tested
// service layer, but no route ever existed) and that login/refresh work
// as genuinely public (pre-auth) endpoints while push/send still requires
// full authentication.
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { app, registerModules } from '../../../app';
import { prisma } from '@/common/config/prisma';
import { authInternal } from '@/modules/m02-core-architecture';
import { TEST_COMPANY_ID, mintBearer, TEST_USER_ID } from '@/tests/helpers/auth';

describe.runIf(process.env.TEST_DB === '1')('M29 — Mobile Auth & Push (real DB, real HTTP)', () => {
  const userId = randomUUID();
  const username = `mobile-http-${userId.slice(0, 8)}`;
  const password = 'RealPassword123!';

  beforeAll(async () => {
    await registerModules();
    const passwordHash = await authInternal.hashPassword(password);
    await prisma.user_master.create({
      data: {
        id: userId, company_id: TEST_COMPANY_ID, name: 'Mobile HTTP Test User',
        email: `${username}@test.com`, username, password_hash: passwordHash,
      },
    });
  });

  afterAll(async () => {
    await prisma.user_master.deleteMany({ where: { id: userId } });
  });

  it('POST /auth/login works with NO token (pre-auth, real M02 login underneath)', async () => {
    const res = await request(app)
      .post('/api/v1/mobile/auth/login')
      .send({ username, password, companyCode: 'TESTCO' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
  });

  it('POST /auth/login 401s on wrong password (real rejection, not a stray 500)', async () => {
    const res = await request(app)
      .post('/api/v1/mobile/auth/login')
      .send({ username, password: 'wrong', companyCode: 'TESTCO' });
    expect(res.status).toBe(401);
  });

  it('POST /auth/refresh works with NO access token, using only the refresh token as credential', async () => {
    const login = await request(app)
      .post('/api/v1/mobile/auth/login')
      .send({ username, password, companyCode: 'TESTCO' });
    const res = await request(app)
      .post('/api/v1/mobile/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('POST /push/send 401s without a token — this endpoint is NOT public like login/refresh', async () => {
    const res = await request(app).post('/api/v1/mobile/push/send').send({ deviceToken: 'x', message: {} });
    expect(res.status).toBe(401);
  });

  it('POST /push/send authenticates fine and honestly reports not-delivered (no real push provider configured)', async () => {
    const res = await request(app)
      .post('/api/v1/mobile/push/send')
      .set('Authorization', mintBearer(TEST_COMPANY_ID, TEST_USER_ID))
      .send({ deviceToken: 'device-token-http-test', message: { title: 'Hi', body: 'Test' } });
    expect(res.status).toBe(200);
    expect(res.body.data.delivered).toBe(false);
  });
});
