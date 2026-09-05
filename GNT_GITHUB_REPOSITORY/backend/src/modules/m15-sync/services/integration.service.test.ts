// M15 — Integration service getAuthToken ki jaanch (DB-gated): API_KEY/BASIC/expired-OAuth2
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { IntegrationService } from './integration.service';

const TENANT = '00000000-0000-4000-8000-000000000083';

async function cleanup() {
  await prisma.externalIntegration.deleteMany({ where: { tenantId: TENANT } });
}

async function createIntegration(authType: string, authConfig: Record<string, unknown>) {
  return prisma.externalIntegration.create({
    data: {
      tenantId: TENANT,
      integrationCode: `INT-${Math.random().toString(36).slice(2, 10)}`,
      name: 'test', provider: 'TALLY', authType,
      authConfig: authConfig as never,
    },
  });
}

describe.runIf(process.env.TEST_DB === '1')('M15 integration getAuthToken — live DB', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('API_KEY auth → apiKey wapas', async () => {
    const i = await createIntegration('API_KEY', { apiKey: 'secret-key' });
    expect(await IntegrationService.getAuthToken(i.id, TENANT)).toBe('secret-key');
  });

  it('BASIC auth → credentials wapas', async () => {
    const i = await createIntegration('BASIC', { credentials: 'basic-cred' });
    expect(await IntegrationService.getAuthToken(i.id, TENANT)).toBe('basic-cred');
  });

  it('OAUTH2 expired (bina refreshToken) → null (fail-closed, chupchap token nahi)', async () => {
    const i = await createIntegration('OAUTH2', {
      accessToken: 'expired-token',
      expiresAt: new Date(Date.now() - 1000).toISOString(),
    });
    expect(await IntegrationService.getAuthToken(i.id, TENANT)).toBeNull();
  });

  it('OAUTH2 valid (future expiry) → accessToken wapas', async () => {
    const i = await createIntegration('OAUTH2', {
      accessToken: 'valid-token',
      expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    });
    expect(await IntegrationService.getAuthToken(i.id, TENANT)).toBe('valid-token');
  });
});
