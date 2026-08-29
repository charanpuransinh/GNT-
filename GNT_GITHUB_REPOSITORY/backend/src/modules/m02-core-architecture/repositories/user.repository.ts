import { prisma } from '@/common/config/env-config';
import { logger } from '@/common/logging/logger';

export const userRepository = {
  async findById(id: string) {
    return prisma.user_master.findUnique({
      where: { id },
      include: {
        user_role: {
          include: {
            role_master: true,
          },
        },
      },
    });
  },

  async findByUsernameAndCompany(username: string, companyCode: string) {
    return prisma.user_master.findFirst({
      where: {
        username,
        company_master: {
          code: companyCode,
        },
      },
    });
  },

  async findByCompanyId(companyId: string) {
    return prisma.user_master.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  },

  async create(data: any) {
    return prisma.user_master.create({
      data,
    });
  },

  async update(id: string, data: any) {
    return prisma.user_master.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.user_master.delete({
      where: { id },
    });
  },

  async incrementFailedAttempts(id: string) {
    return prisma.user_master.update({
      where: { id },
      data: {
        failedLoginAttempts: {
          increment: 1,
        },
      },
    });
  },

  async resetFailedAttempts(id: string) {
    return prisma.user_master.update({
      where: { id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });
  },

  async updateLastLogin(id: string) {
    return prisma.user_master.update({
      where: { id },
      data: {
        lastLoginAt: new Date(),
      },
    });
  },
};
