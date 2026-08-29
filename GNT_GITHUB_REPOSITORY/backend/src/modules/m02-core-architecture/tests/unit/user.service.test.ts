import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/user.service';
import { userRepository } from '../../repositories/user.repository';
import { authInternal } from '../../services/auth.internal';
import { AppError } from '@/common/errors/error-classes';

vi.mock('../../repositories/user.repository');
vi.mock('../../services/auth.internal');

describe('M02 - userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return users for a company', async () => {
      const mockUsers = [{ id: 'user-1', companyId: 'company-123' }];
      vi.mocked(userRepository.findByCompanyId).mockResolvedValue(mockUsers as any);

      const result = await userService.listUsers('company-123');

      expect(result).toEqual(mockUsers);
    });
  });

  describe('getUserById', () => {
    it('should return the user when found', async () => {
      const mockUser = { id: 'user-1', username: 'testuser' };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as any);

      const result = await userService.getUserById('user-1');

      expect(result).toEqual(mockUser);
    });

    it('should throw AppError when user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as any);

      await expect(userService.getUserById('missing-id')).rejects.toThrow(AppError);
    });
  });

  describe('createUser', () => {
    it('should hash password and create the user', async () => {
      const input = { username: 'newuser', password: 'plain-pass', companyId: 'company-123' };
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(null as any);
      vi.mocked(authInternal.hashPassword).mockResolvedValue('hashed-pass' as any);
      vi.mocked(userRepository.create).mockResolvedValue({ id: 'user-2', username: 'newuser' } as any);

      const result = await userService.createUser(input);

      expect(authInternal.hashPassword).toHaveBeenCalledWith('plain-pass');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ username: 'newuser', passwordHash: 'hashed-pass' })
      );
      expect(result).toEqual({ id: 'user-2', username: 'newuser' });
    });

    it('should throw AppError when username already exists', async () => {
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue({ id: 'existing' } as any);

      await expect(
        userService.createUser({ username: 'dupe', password: 'x', companyId: 'company-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('updateUser', () => {
    it('should update fields and re-hash password when provided', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ id: 'user-1' } as any);
      vi.mocked(authInternal.hashPassword).mockResolvedValue('new-hash' as any);
      vi.mocked(userRepository.update).mockResolvedValue({ id: 'user-1' } as any);

      await userService.updateUser('user-1', { password: 'newpass' });

      expect(authInternal.hashPassword).toHaveBeenCalledWith('newpass');
      expect(userRepository.update).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ passwordHash: 'new-hash' })
      );
    });

    it('should throw AppError when user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as any);

      await expect(userService.updateUser('missing-id', {})).rejects.toThrow(AppError);
    });
  });

  describe('deleteUser', () => {
    it('should soft-delete by deactivating the user', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ id: 'user-1' } as any);
      vi.mocked(userRepository.update).mockResolvedValue({ id: 'user-1', isActive: false } as any);

      await userService.deleteUser('user-1');

      expect(userRepository.update).toHaveBeenCalledWith('user-1', { isActive: false });
    });

    it('should throw AppError when user not found', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as any);

      await expect(userService.deleteUser('missing-id')).rejects.toThrow(AppError);
    });
  });
});
