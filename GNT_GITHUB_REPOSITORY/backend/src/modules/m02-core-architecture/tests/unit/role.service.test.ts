// ============================================================================
// M02 — roleService
//
// 2026-09-04 को दोबारा लिखी गई। पुरानी फ़ाइल की createRole test यह जाँचती थी:
//
//     const input = { name: 'Manager', companyId: 'company-123' };
//     expect(roleRepository.create).toHaveBeenCalledWith(input);
//
// यानी वह उसी camelCase `companyId` की पुष्टि कर रही थी जो असली database में
// चलता ही नहीं (column का नाम `company_id` है)। repository mock था, इसलिए
// test हरी रहती थी और production में "भूमिका बनाना" कभी काम नहीं करता था।
//
// अब tests सही व्यवहार जाँचती हैं: snake_case company_id, और हर काम अपनी
// company तक सीमित।
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roleService } from '../../services/role.service';
import { roleRepository } from '../../repositories/role.repository';
import { AppError } from '@/common/errors/error-classes';

vi.mock('../../repositories/role.repository');

const COMPANY = 'company-123';

describe('M02 - roleService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listRoles', () => {
    it('should return roles for a company', async () => {
      const mockRoles = [{ id: 'role-1', name: 'Admin', company_id: COMPANY }];
      vi.mocked(roleRepository.findByCompanyId).mockResolvedValue(mockRoles as any);

      const result = await roleService.listRoles(COMPANY);

      expect(roleRepository.findByCompanyId).toHaveBeenCalledWith(COMPANY);
      expect(result).toEqual(mockRoles);
    });
  });

  describe('getRoleById', () => {
    it('अपनी company की भूमिका मिलती है', async () => {
      const mockRole = { id: 'role-1', name: 'Admin' };
      vi.mocked(roleRepository.findById).mockResolvedValue(mockRole as any);

      const result = await roleService.getRoleById('role-1', COMPANY);

      // company_id साथ गया या नहीं — यही असली जाँच है
      expect(roleRepository.findById).toHaveBeenCalledWith('role-1', COMPANY);
      expect(result).toEqual(mockRole);
    });

    it('दूसरी company की भूमिका पर 404 (मिली ही नहीं)', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null as any);

      await expect(roleService.getRoleById('missing-id', COMPANY)).rejects.toThrow(AppError);
    });
  });

  describe('createRole', () => {
    it('company_id (snake_case) भेजता है — camelCase नहीं', async () => {
      const created = { id: 'role-2', name: 'Manager', company_id: COMPANY };
      vi.mocked(roleRepository.create).mockResolvedValue(created as any);

      const result = await roleService.createRole(COMPANY, { name: 'Manager' });

      // यही वो जाँच है जो पहले उल्टी लिखी थी
      expect(roleRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ company_id: COMPANY, name: 'Manager' })
      );
      const bheja = vi.mocked(roleRepository.create).mock.calls[0][0] as Record<string, unknown>;
      expect(bheja).not.toHaveProperty('companyId');
      expect(result).toEqual(created);
    });
  });

  describe('updateRole', () => {
    it('अपनी company की भूमिका बदल जाती है', async () => {
      vi.mocked(roleRepository.update).mockResolvedValue(1 as any);
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1', name: 'Updated' } as any);

      const result = await roleService.updateRole('role-1', COMPANY, { name: 'Updated' });

      expect(roleRepository.update).toHaveBeenCalledWith('role-1', COMPANY, { name: 'Updated' });
      expect(result).toEqual({ id: 'role-1', name: 'Updated' });
    });

    it('दूसरी company की भूमिका बदली नहीं जा सकती (कुछ मैच नहीं हुआ → 404)', async () => {
      vi.mocked(roleRepository.update).mockResolvedValue(0 as any);

      await expect(roleService.updateRole('dusri-id', COMPANY, { name: 'x' })).rejects.toThrow(AppError);
    });
  });

  describe('deleteRole', () => {
    it('अपनी भूमिका मिटती है जब किसी user को नहीं लगी', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1' } as any);
      vi.mocked(roleRepository.getUserCountForRole).mockResolvedValue(0);
      vi.mocked(roleRepository.delete).mockResolvedValue(1 as any);

      await roleService.deleteRole('role-1', COMPANY);

      expect(roleRepository.delete).toHaveBeenCalledWith('role-1', COMPANY);
    });

    it('दूसरी company की भूमिका मिटाई नहीं जा सकती', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue(null as any);

      await expect(roleService.deleteRole('dusri-id', COMPANY)).rejects.toThrow(AppError);
    });

    it('किसी user को लगी भूमिका नहीं मिटती', async () => {
      vi.mocked(roleRepository.findById).mockResolvedValue({ id: 'role-1' } as any);
      vi.mocked(roleRepository.getUserCountForRole).mockResolvedValue(3);

      await expect(roleService.deleteRole('role-1', COMPANY)).rejects.toThrow(AppError);
    });
  });
});
