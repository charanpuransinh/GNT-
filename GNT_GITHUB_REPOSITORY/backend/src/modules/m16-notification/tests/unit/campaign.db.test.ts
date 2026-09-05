// ============================================================================
// M16 — Campaign DB-gated (CRUD + order-link + tenant isolation)
// ============================================================================

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { campaignService } from '../../services/campaign.service';
import { TEST_COMPANY_ID, TEST_USER_ID } from '@/tests/helpers/auth';

// order-link HMAC secret — sign/verify fail-closed के लिए test में साफ़ सेट करो
process.env.M16_ORDER_LINK_SECRET = 'test-order-link-secret';

const OTHER_COMPANY_ID = '00000000-0000-4000-8000-000000000099';

async function cleanup() {
  await prisma.notificationCampaign.deleteMany({ where: { companyId: { in: [TEST_COMPANY_ID, OTHER_COMPANY_ID] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M16 Campaign — live DB', () => {
  let campaignId = '';

  beforeAll(async () => {
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
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
  });

  it('campaign बनता है (company-scoped)', async () => {
    const c = await campaignService.create(
      { name: 'Festive offer', message: 'Special deal for you', orderOffer: 'Flat 10% off', targetPartyIds: ['p1'] },
      TEST_COMPANY_ID,
      TEST_USER_ID,
    );
    campaignId = c.id;
    expect(c.name).toBe('Festive offer');
    expect(c.companyId).toBe(TEST_COMPANY_ID);
  });

  it('दूसरी company campaign पढ़/मिटा न पाए', async () => {
    await expect(campaignService.get(campaignId, OTHER_COMPANY_ID)).rejects.toThrow();
    await expect(campaignService.delete(campaignId, OTHER_COMPANY_ID)).rejects.toThrow();
    const still = await campaignService.get(campaignId, TEST_COMPANY_ID);
    expect(still).toBeTruthy();
  });

  it('order-link बनता और public resolve होता है', async () => {
    const { link } = await campaignService.generateOrderLink(campaignId, TEST_COMPANY_ID, 'party-1');
    expect(link).toContain('/order-link/');

    const token = link.split('/order-link/')[1];
    const resolved = await campaignService.resolveOrderLink(token);
    expect(resolved.campaignId).toBe(campaignId);
    expect(resolved.partyId).toBe('party-1');
    expect(resolved.offer).toBe('Flat 10% off');
  });

  it('अमान्य order-link resolve नहीं होता', async () => {
    await expect(campaignService.resolveOrderLink('nakli-token')).rejects.toThrow();
  });

  it('campaign मिटता है (अपनी company)', async () => {
    await campaignService.delete(campaignId, TEST_COMPANY_ID);
    await expect(campaignService.get(campaignId, TEST_COMPANY_ID)).rejects.toThrow();
  });
});
