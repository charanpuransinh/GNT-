import { Prisma } from '@prisma/client';
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

  // 2026-09-04: `data: any` हटाया। वो `any` ही असली गड़बड़ी की जड़ था —
  // user.service `{ isActive: false }` भेजता था जबकि schema में field `is_active` है।
  // `any` की वजह से यह compile हो जाता था और चलते वक़्त फटता था:
  //   PrismaClientValidationError — Invalid `prisma.user_master.update()` invocation
  // यानी "user delete" सुविधा कभी चली ही नहीं। चलाकर पकड़ा।
  // अब Prisma के असली types लगे हैं — ग़लत field नाम अब compile पर ही पकड़ा जाएगा।
  async create(data: Prisma.user_masterUncheckedCreateInput) {
    return prisma.user_master.create({
      data,
    });
  },

  // ⚠️ tenant: `where` में company_id ज़रूरी है। पहले सिर्फ़ id से चलता था, इसलिए
  // एक company का user दूसरी company के user को बदल/हटा सकता था — बस id जानकर।
  // companyId न मिले तो query चलेगी ही नहीं (fail-closed), सबका data कभी नहीं।
  async update(id: string, companyId: string, data: Prisma.user_masterUncheckedUpdateInput) {
    if (!companyId) throw new Error('userRepository.update: companyId ज़रूरी है (tenant guard)');
    const res = await prisma.user_master.updateMany({
      where: { id, company_id: companyId },
      data,
    });
    return res.count > 0 ? prisma.user_master.findUnique({ where: { id } }) : null;
  },

  async delete(id: string, companyId: string) {
    if (!companyId) throw new Error('userRepository.delete: companyId ज़रूरी है (tenant guard)');
    const res = await prisma.user_master.deleteMany({
      where: { id, company_id: companyId },
    });
    return res.count > 0;
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
