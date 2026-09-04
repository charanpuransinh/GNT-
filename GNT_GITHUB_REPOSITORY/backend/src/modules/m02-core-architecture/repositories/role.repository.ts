import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/env-config';

export const roleRepository = {
  // 2026-09-04: पहले सिर्फ़ id से खोजा जाता था — यानी दूसरी company की भूमिका
  // भी पढ़ी/बदली/मिटाई जा सकती थी। role_master company से बँधी है, इसलिए अब
  // हर जगह company_id साथ जाता है।
  async findById(id: string, companyId: string) {
    return prisma.role_master.findFirst({
      where: { id, company_id: companyId },
      include: {
        role_permission: {
          include: {
            permission_master: true,
          },
        },
      },
    });
  },

  async findByCompanyId(companyId: string) {
    return prisma.role_master.findMany({
      where: { company_id: companyId },
      include: {
        role_permission: {
          include: {
            permission_master: true,
          },
        },
      },
    });
  },

  async getRolesByUserId(userId: string) {
    const userRoles = await prisma.user_role.findMany({
      where: { user_id: userId },
      include: {
        role_master: true,
      },
    });
    return userRoles.map((ur) => ur.role_master);
  },

  async getPermissionsByUserId(userId: string): Promise<string[]> {
    const userRoles = await prisma.user_role.findMany({
      where: { user_id: userId },
      include: {
        role_master: {
          include: {
            role_permission: {
              include: {
                permission_master: true,
              },
            },
          },
        },
      },
    });

    const permissions = new Set<string>();
    userRoles.forEach((ur) => {
      ur.role_master.role_permission.forEach((rp) => {
        permissions.add(`${rp.permission_master.module}:${rp.permission_master.action}`);
      });
    });

    return Array.from(permissions);
  },

  // `data: any` की वजह से controller का camelCase `companyId` चुपचाप यहाँ तक
  // पहुँच जाता था, जबकि column का नाम `company_id` है — इसलिए भूमिका बनाना
  // कभी काम ही नहीं करता था। अब असली type है, नाम की ग़लती compile पर रुकेगी।
  async create(data: Prisma.role_masterUncheckedCreateInput) {
    return prisma.role_master.create({
      data,
    });
  },

  async update(id: string, companyId: string, data: Prisma.role_masterUncheckedUpdateInput) {
    const { count } = await prisma.role_master.updateMany({
      where: { id, company_id: companyId },
      data,
    });
    return count;
  },

  async delete(id: string, companyId: string) {
    const { count } = await prisma.role_master.deleteMany({
      where: { id, company_id: companyId },
    });
    return count;
  },

  async getUserCountForRole(roleId: string) {
    return prisma.user_role.count({
      where: { role_id: roleId },
    });
  },
};
