import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/env-config';
import { logger } from '@/common/logging/logger';

export const deviceRepository = {
  async getActiveSessionsByUserId(userId: string) {
    return prisma.active_session.findMany({
      where: {
        user_id: userId,
        expires_at: { gt: new Date() },
      },
      orderBy: { last_active_at: 'desc' },
    });
  },

  async getSessionById(sessionId: string) {
    return prisma.active_session.findUnique({
      where: { id: sessionId },
    });
  },

  // 2026-09-04: नीचे के पाँचों `data: any` हटाए गए।
  // वही ढीली typing M02 में एक असली गड़बड़ी छिपा चुकी है — वहाँ service `isActive`
  // भेजती थी जबकि schema में `is_active` है, `any` ने compile होने दिया, और
  // "user हटाना" चलते वक़्त फटता था। कोई test नहीं पकड़ पाया।
  // अब Prisma के असली types लगे हैं — ग़लत field नाम compile पर ही पकड़ा जाएगा।

  async createSession(data: Prisma.active_sessionUncheckedCreateInput) {
    return prisma.active_session.create({ data });
  },

  async updateSessionLastActive(sessionId: string) {
    return prisma.active_session.update({
      where: { id: sessionId },
      data: { last_active_at: new Date() },
    });
  },

  async deleteSession(sessionId: string) {
    return prisma.active_session.delete({
      where: { id: sessionId },
    });
  },

  async deleteAllSessionsByUserId(userId: string, exceptSessionId?: string) {
    return prisma.active_session.deleteMany({
      where: {
        user_id: userId,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
    });
  },

  async getDevicesByUserId(userId: string) {
    return prisma.device_registry.findMany({
      where: { user_id: userId },
      orderBy: { last_seen_at: 'desc' },
    });
  },

  async getDeviceByUserAndName(userId: string, deviceName: string) {
    return prisma.device_registry.findFirst({
      where: { user_id: userId, device_name: deviceName },
    });
  },

  async createDevice(data: Prisma.device_registryUncheckedCreateInput) {
    return prisma.device_registry.create({ data });
  },

  async updateDevice(deviceId: string, data: Prisma.device_registryUncheckedUpdateInput) {
    return prisma.device_registry.update({
      where: { id: deviceId },
      data,
    });
  },

  async getDeploymentSettings(companyId: string) {
    return prisma.deployment_settings.findUnique({
      where: { company_id: companyId },
    });
  },

  async createDeploymentSettings(data: Prisma.deployment_settingsUncheckedCreateInput) {
    return prisma.deployment_settings.create({ data });
  },

  async updateDeploymentSettings(companyId: string, data: Prisma.deployment_settingsUncheckedUpdateInput) {
    return prisma.deployment_settings.update({
      where: { company_id: companyId },
      data,
    });
  },
};
