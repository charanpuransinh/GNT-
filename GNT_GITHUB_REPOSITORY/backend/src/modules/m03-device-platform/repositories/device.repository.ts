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

  async createSession(data: any) {
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

  async createDevice(data: any) {
    return prisma.device_registry.create({ data });
  },

  async updateDevice(deviceId: string, data: any) {
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

  async createDeploymentSettings(data: any) {
    return prisma.deployment_settings.create({ data });
  },

  async updateDeploymentSettings(companyId: string, data: any) {
    return prisma.deployment_settings.update({
      where: { company_id: companyId },
      data,
    });
  },
};
