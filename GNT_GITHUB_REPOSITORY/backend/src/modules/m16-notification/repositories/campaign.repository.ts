// M16 — Campaign Repository (company-scoped, fail-closed)
import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';

export interface CreateCampaignDto {
  name: string;
  message: string;
  channel?: string;
  targetPartyIds?: string[];
  orderOffer?: string;
}

export interface UpdateCampaignDto {
  name?: string;
  message?: string;
  targetPartyIds?: string[] | null;
  orderOffer?: string | null;
}

export class CampaignRepository {
  async create(dto: CreateCampaignDto, companyId: string, userId: string) {
    return prisma.notificationCampaign.create({
      data: {
        companyId,
        name: dto.name,
        message: dto.message,
        channel: dto.channel ?? 'whatsapp',
        targetPartyIds: (dto.targetPartyIds ?? null) as Prisma.InputJsonValue,
        orderOffer: dto.orderOffer ?? null,
        createdBy: userId,
      },
    });
  }

  async list(companyId: string) {
    return prisma.notificationCampaign.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  }

  async findById(id: string, companyId: string) {
    return prisma.notificationCampaign.findFirst({ where: { id, companyId } });
  }

  /** public order-link के लिए — token ही प्रमाण है, इसलिए company-scope नहीं */
  async findByIdUnscoped(id: string) {
    return prisma.notificationCampaign.findFirst({ where: { id } });
  }

  async update(id: string, companyId: string, dto: UpdateCampaignDto) {
    const result = await prisma.notificationCampaign.updateMany({
      where: { id, companyId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.message !== undefined ? { message: dto.message } : {}),
        ...(dto.targetPartyIds !== undefined ? { targetPartyIds: dto.targetPartyIds as Prisma.InputJsonValue } : {}),
        ...(dto.orderOffer !== undefined ? { orderOffer: dto.orderOffer } : {}),
      },
    });
    if (result.count === 0) throw new Error('Campaign not found');
    const campaign = await prisma.notificationCampaign.findFirst({ where: { id, companyId } });
    if (!campaign) throw new Error('Campaign not found');
    return campaign;
  }

  async delete(id: string, companyId: string) {
    const result = await prisma.notificationCampaign.deleteMany({ where: { id, companyId } });
    if (result.count === 0) throw new Error('Campaign not found');
  }

  async markStatus(id: string, companyId: string, status: string, sentCount?: number, failedCount?: number) {
    await prisma.notificationCampaign.updateMany({
      where: { id, companyId },
      data: {
        status,
        ...(sentCount !== undefined ? { sentCount } : {}),
        ...(failedCount !== undefined ? { failedCount } : {}),
      },
    });
  }
}
