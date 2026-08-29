import { prisma } from '@/common/config/env-config';
import { logger } from '@/common/logging/logger';

export const deviceRepository = {
  async getActiveSessionsByUserId(userId: string) {
    return prisma.active_session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
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
      data: { lastActiveAt: new Date() },
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
        userId,
        ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}),
      },
    });
  },

  async getDevicesByUserId(userId: string) {
    return prisma.device_registry.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });
  },

  async getDeviceByUserAndName(userId: string, deviceName: string) {
    return prisma.device_registry.findFirst({
      where: { userId, deviceName },
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
      where: { companyId },
    });
  },

  async createDeploymentSettings(data: any) {
    return prisma.deployment_settings.create({ data });
  },

  async updateDeploymentSettings(companyId: string, data: any) {
    return prisma.deployment_settings.update({
      where: { companyId },
      data,
    });
  },
};
