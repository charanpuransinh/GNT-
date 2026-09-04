import { roleRepository } from '../repositories/role.repository';
import { AppError } from '@/common/errors/error-classes';

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  is_system_role?: boolean;
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}

export const roleService = {
  async listRoles(companyId: string) {
    return roleRepository.findByCompanyId(companyId);
  },

  // हर method अब companyId लेती है — दूसरी company की भूमिका पर 404 (403 नहीं,
  // वरना जवाब से पता चल जाता कि वो भूमिका मौजूद है)।
  async getRoleById(id: string, companyId: string) {
    const role = await roleRepository.findById(id, companyId);
    if (!role) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }
    return role;
  },

  async createRole(companyId: string, data: CreateRoleInput) {
    return roleRepository.create({
      company_id: companyId,   // पहले controller camelCase `companyId` भेजता था
      name: data.name,
      description: data.description ?? null,
      ...(data.is_system_role !== undefined ? { is_system_role: data.is_system_role } : {}),
    });
  },

  async updateRole(id: string, companyId: string, data: UpdateRoleInput) {
    const count = await roleRepository.update(id, companyId, {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    });
    if (count === 0) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }
    return roleRepository.findById(id, companyId);
  },

  async deleteRole(id: string, companyId: string) {
    const role = await roleRepository.findById(id, companyId);
    if (!role) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }

    // Check if role is assigned to any user
    const userCount = await roleRepository.getUserCountForRole(id);
    if (userCount > 0) {
      throw new AppError('GNT-ERR-2011', 'Cannot delete role assigned to users', 409);
    }

    const count = await roleRepository.delete(id, companyId);
    if (count === 0) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }
    return { deleted: true };
  },
};
