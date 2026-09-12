// ============================================================================
// M29 — Mobile Auth & Push — real DB wiring
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { prisma } from '@/common/config/prisma';
import { authInternal } from '@/modules/m02-core-architecture';
import { TEST_COMPANY_ID } from '@/tests/helpers/auth';
import { mobileAuthService, MobileAuthError } from '../api/mobile-auth.service';
import { pushNotificationService } from '../notification/push-notification.service';

describe.runIf(process.env.TEST_DB === '1')('M29 — MobileAuthService (real M02 login/refresh)', () => {
  const userId = randomUUID();
  const username = `mobile-${userId.slice(0, 8)}`;
  const password = 'RealPassword123!';

  beforeAll(async () => {
    const passwordHash = await authInternal.hashPassword(password);
    await prisma.user_master.create({
      data: {
        id: userId, company_id: TEST_COMPANY_ID, name: 'Mobile Test User',
        email: `${username}@test.com`, username, password_hash: passwordHash,
      },
    });
  });

  afterAll(async () => {
    await prisma.user_master.deleteMany({ where: { id: userId } });
  });

  it('logs in with real credentials and returns real tokens + a real expiresInSeconds (~900s access TTL)', async () => {
    const tokens = await mobileAuthService.login({ username, password, companyCode: 'TESTCO' });
    expect(tokens.accessToken).toBeTruthy();
    expect(tokens.refreshToken).toBeTruthy();
    expect(tokens.expiresInSeconds).toBeGreaterThan(0);
    expect(tokens.expiresInSeconds).toBeLessThanOrEqual(900);
  });

  it('rejects wrong password', async () => {
    await expect(mobileAuthService.login({ username, password: 'wrong', companyCode: 'TESTCO' })).rejects.toThrow(MobileAuthError);
  });

  it('rejects wrong companyCode (company-scoped username lookup)', async () => {
    await expect(mobileAuthService.login({ username, password, companyCode: 'NOPE' })).rejects.toThrow(MobileAuthError);
  });

  it('refreshes real tokens with a real refresh token', async () => {
    const initial = await mobileAuthService.login({ username, password, companyCode: 'TESTCO' });
    const refreshed = await mobileAuthService.refresh(initial.refreshToken);
    expect(refreshed.accessToken).toBeTruthy();
    expect(refreshed.accessToken).not.toBe(initial.accessToken);
  });

  it('rejects an invalid refresh token', async () => {
    await expect(mobileAuthService.refresh('not-a-real-token')).rejects.toThrow(MobileAuthError);
  });
});

describe('M29 — PushNotificationService (no real provider exists — honest default)', () => {
  it('reports not-delivered when no provider is configured', async () => {
    const result = await pushNotificationService.send('device-token-1', { title: 'Hi', body: 'Test' });
    expect(result.delivered).toBe(false);
  });

  it('short-circuits with no deviceToken', async () => {
    const result = await pushNotificationService.send('', { title: 'Hi', body: 'Test' });
    expect(result.delivered).toBe(false);
  });
});
