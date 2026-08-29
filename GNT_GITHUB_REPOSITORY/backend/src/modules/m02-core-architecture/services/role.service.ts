import { roleRepository } from '../repositories/role.repository';
import { AppError } from '@/common/errors/error-classes';

export const roleService = {
  async listRoles(companyId: string) {
    return roleRepository.findByCompanyId(companyId);
  },

  async getRoleById(id: string) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }
    return role;
  },

  async createRole(data: any) {
    return roleRepository.create(data);
  },

  async updateRole(id: string, data: any) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }
    return roleRepository.update(id, data);
  },

  async deleteRole(id: string) {
    const role = await roleRepository.findById(id);
    if (!role) {
      throw new AppError('GNT-ERR-2010', 'Role not found', 404);
    }

    // Check if role is assigned to any user
    const userCount = await roleRepository.getUserCountForRole(id);
    if (userCount > 0) {
      throw new AppError('GNT-ERR-2011', 'Cannot delete role assigned to users', 409);
    }

    return roleRepository.delete(id);
  },
};
