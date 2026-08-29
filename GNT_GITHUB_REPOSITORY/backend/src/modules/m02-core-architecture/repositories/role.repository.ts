import { prisma } from '@/common/config/env-config';

export const roleRepository = {
  async findById(id: string) {
    return prisma.role_master.findUnique({
      where: { id },
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
      where: { companyId },
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
      where: { userId },
      include: {
        role_master: true,
      },
    });
    return userRoles.map((ur) => ur.role_master);
  },

  async getPermissionsByUserId(userId: string): Promise<string[]> {
    const userRoles = await prisma.user_role.findMany({
      where: { userId },
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

  async create(data: any) {
    return prisma.role_master.create({
      data,
    });
  },

  async update(id: string, data: any) {
    return prisma.role_master.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.role_master.delete({
      where: { id },
    });
  },

  async getUserCountForRole(roleId: string) {
    return prisma.user_role.count({
      where: { roleId },
    });
  },
};
