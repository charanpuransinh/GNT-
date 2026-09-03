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
          // CERT-003 शर्त 1 (टास्क #024 — C2): login की चाबी अब company_master.code है, GSTIN नहीं
          code: companyCode,
        },
      },
    });
  },

  async findByCompanyId(companyId: string) {
    return prisma.user_master.findMany({
      where: { company_id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        avatar: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
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
        failed_login_attempts: {
          increment: 1,
        },
      },
    });
  },

  async resetFailedAttempts(id: string) {
    return prisma.user_master.update({
      where: { id },
      data: {
        failed_login_attempts: 0,
        locked_until: null,
      },
    });
  },

  async updateLastLogin(id: string) {
    return prisma.user_master.update({
      where: { id },
      data: {
        last_login_at: new Date(),
      },
    });
  },
};
