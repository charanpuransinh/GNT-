import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roleService } from '../../services/role.service';
import { roleRepository } from '../../repositories/role.repository';
import { AppError } from '@/common/errors/error-classes';

vi.mock('../../repositories/role.repository');

describe('M02 - roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listRoles', () => {
    it('should return roles for a company', async () => {
      const mockRoles = [{ id: 'role-1', name: 'Admin', companyId: 'company-123' }];
      vi.mocked(roleRepository.findByCompanyId).mockResolvedValue(mockRoles as any);

      const result = await roleService.listRoles('company-123');

      expect(roleRepository.findByCompanyId).toHaveBeenCalledWith('company-123');
      expect(result).toEqual(mockRoles);
    });
  });

  describe('getRoleById', () => {
    it('should return the role when found', async () => {
      const mockRole = { id: 'role-1', name: 'Admin' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);

      const result = await roleService.getRoleById('role-1');

      expect(result).toEqual(mockRole);
    });

    it('should throw AppError when role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null as any);

      await expect(roleService.getRoleById('missing-id')).rejects.toThrow(AppError);
    });
  });

  describe('createRole', () => {
    it('should create and return the new role', async () => {
      const input = { name: 'Manager', companyId: 'company-123' };
      const created = { id: 'role-2', ...input };
      vi.mocked(roleRepository.create).mockResolvedValue(created as any);

      const result = await roleService.createRole(input);

      expect(roleRepository.create).toHaveBeenCalledWith(input);
      expect(result).toEqual(created);
    });
  });

  describe('updateRole', () => {
    it('should update when role exists', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1' } as any);
      vi.mocked(roleRepository.update).mockResolvedValue({ id: 'role-1', name: 'Updated' } as any);

      const result = await roleService.updateRole('role-1', { name: 'Updated' });

      expect(result).toEqual({ id: 'role-1', name: 'Updated' });
    });

    it('should throw AppError when role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null as any);

      await expect(roleService.updateRole('missing-id', {})).rejects.toThrow(AppError);
    });
  });

  describe('deleteRole', () => {
    it('should delete when role exists and has no assigned users', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1' } as any);
      vi.mocked(roleRepository.getUserCountForRole).mockResolvedValue(0);
      vi.mocked(roleRepository.delete).mockResolvedValue(undefined as any);

      await roleService.deleteRole('role-1');

      expect(roleRepository.delete).toHaveBeenCalledWith('role-1');
    });

    it('should throw AppError when role not found', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null as any);

      await expect(roleService.deleteRole('missing-id')).rejects.toThrow(AppError);
    });

    it('should throw AppError when role is still assigned to users', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1' } as any);
      vi.mocked(roleRepository.getUserCountForRole).mockResolvedValue(3);

      await expect(roleService.deleteRole('role-1')).rejects.toThrow(AppError);
    });
  });
});
