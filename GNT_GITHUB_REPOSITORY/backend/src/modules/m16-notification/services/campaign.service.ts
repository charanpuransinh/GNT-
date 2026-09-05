// M16 — Campaign Service (company-scoped; order-link = HMAC-signed token)
import { AppError } from '@/common/errors/error-classes';
import { partyService } from '@/modules/m05-party-management';
import { CampaignRepository, CreateCampaignDto, UpdateCampaignDto } from '../repositories/campaign.repository';
import { notificationService } from './notification.service';
import { signOrderLink, verifyOrderLink } from '../utils/order-link';

const ORDER_LINK_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 दिन

export class CampaignService {
  private repo = new CampaignRepository();

  async create(dto: CreateCampaignDto, companyId: string, userId: string) {
    if (!dto.name?.trim()) throw new AppError('BAD_REQUEST', 'नाम ज़रूरी है', 400);
    if (!dto.message?.trim()) throw new AppError('BAD_REQUEST', 'संदेश ज़रूरी है', 400);
    return this.repo.create(dto, companyId, userId);
  }

  async list(companyId: string) {
    return this.repo.list(companyId);
  }

  async get(id: string, companyId: string) {
    const c = await this.repo.findById(id, companyId);
    if (!c) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    return c;
  }

  async update(id: string, companyId: string, dto: UpdateCampaignDto) {
    return this.repo.update(id, companyId, dto);
  }

  async delete(id: string, companyId: string) {
    return this.repo.delete(id, companyId);
  }

  /** किसी party के लिए secure order-link बनाना (7 दिन valid) */
  async generateOrderLink(id: string, companyId: string, partyId: string): Promise<{ link: string; expiresAt: string }> {
    const c = await this.repo.findById(id, companyId);
    if (!c) throw new AppError('NOT_FOUND', 'Campaign not found', 404);
    const expiresAt = Date.now() + ORDER_LINK_TTL_MS;
    const token = signOrderLink({ c: c.id, p: partyId, e: expiresAt });
    return { link: `/api/v1/notifications/order-link/${token}`, expiresAt: new Date(expiresAt).toISOString() };
  }

  /** buyer बिना login link खोलता है — token ही पहचान है (fail-closed) */
  async resolveOrderLink(token: string) {
    const payload = verifyOrderLink(token);
    if (!payload) throw new AppError('FORBIDDEN', 'अमान्य या expired order-link', 403);

    // buyer के पास company नहीं — token ही प्रमाण है; इसलिए unscoped lookup
    const c = await this.repo.findByIdUnscoped(payload.c);
    if (!c) throw new AppError('NOT_FOUND', 'Campaign not found', 404);

    return {
      campaignId: c.id,
      campaignName: c.name,
      partyId: payload.p,
      offer: c.orderOffer ?? c.message,
      expiresAt: new Date(payload.e).toISOString(),
    };
  }

  /** campaign भेजना — हर party को उसकी order-link के साथ notification */
  async send(id: string, companyId: string, userId: string) {
    const c = await this.repo.findById(id, companyId);
    if (!c) throw new AppError('NOT_FOUND', 'Campaign not found', 404);

    const partyIds = (c.targetPartyIds as string[] | null) ?? [];
    if (partyIds.length === 0) throw new AppError('BAD_REQUEST', 'कोई target party नहीं', 400);

    let sent = 0;
    let failed = 0;

    for (const partyId of partyIds) {
      try {
        const party = await partyService.getPartyById(partyId, companyId);
        if (!party || !party.phone) {
          failed++;
          continue;
        }
        const { link } = await this.generateOrderLink(id, companyId, partyId);
        await notificationService.sendNotification({
          userId: 'system',
          companyId,
          title: c.name,
          message: `${c.message}\n\n${link}`,
          type: 'whatsapp',
          entityType: 'automation',
          channels: ['whatsapp'],
          toAddress: party.phone,
        });
        sent++;
      } catch {
        failed++;
      }
    }

    await this.repo.markStatus(id, companyId, failed > 0 ? 'COMPLETED' : 'COMPLETED', sent, failed);
    return { campaignId: id, sent, failed };
  }
}

export const campaignService = new CampaignService();
