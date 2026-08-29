import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/auth.service';
import { userRepository } from '../../repositories/user.repository';
import { roleRepository } from '../../repositories/role.repository';
import { authInternal } from '../../services/auth.internal';
import { AppError } from '@/common/errors/error-classes';

vi.mock('../../repositories/user.repository');
vi.mock('../../repositories/role.repository');
vi.mock('../../services/auth.internal');

describe('M02 - authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens and user on valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        companyId: 'company-123',
        branchId: 'branch-123',
        isActive: true,
        failedLoginAttempts: 0,
        twoFactorEnabled: false,
        lastLoginAt: new Date(),
      };

      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(mockUser as any);
      vi.mocked(authInternal.verifyPassword).mockResolvedValue(true);
      vi.mocked(authInternal.generateTokenPair).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      vi.mocked(roleRepository.getRolesByUserId).mockResolvedValue([
        { id: 'role-1', name: 'Admin', description: 'Administrator' },
      ] as any);
      vi.mocked(roleRepository.getPermissionsByUserId).mockResolvedValue([
        'M06:read',
        'M06:write',
      ]);
      vi.mocked(authInternal.isHighRiskLogin).mockReturnValue(false);

      const result = await authService.login({
        username: 'testuser',
        password: 'password123',
        companyCode: 'COMP001',
      });

      expect(result.user.id).toBe('user-123');
      expect(result.accessToken).toBe('access-token');
      expect(result.requiresOtp).toBe(false);
      expect(result.user.permissions).toContain('M06:read');
    });

    it('should throw error for invalid credentials', async () => {
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(null);

      await expect(
        authService.login({
          username: 'wronguser',
          password: 'wrongpass',
          companyCode: 'COMP001',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error for inactive account', async () => {
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue({
        id: 'user-123',
        isActive: false,
      } as any);

      await expect(
        authService.login({
          username: 'testuser',
          password: 'password123',
          companyCode: 'COMP001',
        })
      ).rejects.toThrow('Account is disabled');
    });

    it('should require OTP when 2FA is enabled', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed-password',
        companyId: 'company-123',
        isActive: true,
        failedLoginAttempts: 0,
        twoFactorEnabled: true,
        lastLoginAt: new Date(),
      };

      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(mockUser as any);
      vi.mocked(authInternal.verifyPassword).mockResolvedValue(true);
      vi.mocked(authInternal.generateTokenPair).mockReturnValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      vi.mocked(roleRepository.getRolesByUserId).mockResolvedValue([]);
      vi.mocked(roleRepository.getPermissionsByUserId).mockResolvedValue([]);
      vi.mocked(authInternal.sendOtp).mockResolvedValue();

      const result = await authService.login({
        username: 'testuser',
        password: 'password123',
        companyCode: 'COMP001',
      });

      expect(result.requiresOtp).toBe(true);
      expect(authInternal.sendOtp).toHaveBeenCalledWith('user-123', 'test@example.com');
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        id: 'user-123',
        isActive: true,
        failedLoginAttempts: 5,
        passwordHash: 'hashed',
      };

      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(mockUser as any);
      vi.mocked(authInternal.verifyPassword).mockResolvedValue(true);

      await expect(
        authService.login({
          username: 'testuser',
          password: 'password123',
          companyCode: 'COMP001',
        })
      ).rejects.toThrow('Account locked');
    });
  });

  describe('verifyOtp', () => {
    it('should return tokens on valid OTP', async () => {
      vi.mocked(authInternal.verifyOtp).mockResolvedValue(true);
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 'user-123',
        companyId: 'company-123',
        name: 'Test',
        email: 'test@example.com',
        username: 'testuser',
        isActive: true,
      } as any);
      vi.mocked(roleRepository.getRolesByUserId).mockResolvedValue([]);
      vi.mocked(roleRepository.getPermissionsByUserId).mockResolvedValue([]);
      vi.mocked(authInternal.generateTokenPair).mockReturnValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await authService.verifyOtp({
        userId: 'user-123',
        otp: '123456',
      });

      expect(result.accessToken).toBe('new-access');
    });

    it('should throw error for invalid OTP', async () => {
      vi.mocked(authInternal.verifyOtp).mockResolvedValue(false);

      await expect(
        authService.verifyOtp({
          userId: 'user-123',
          otp: '000000',
        })
      ).rejects.toThrow('Invalid or expired OTP');
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens for valid refresh token', async () => {
      vi.mocked(authInternal.verifyRefreshToken).mockReturnValue({
        userId: 'user-123',
        roles: ['role-1'],
      });
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 'user-123',
        companyId: 'company-123',
        isActive: true,
      } as any);
      vi.mocked(authInternal.generateTokenPair).mockReturnValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const result = await authService.refreshToken('valid-refresh-token');

      expect(result.accessToken).toBe('new-access');
    });

    it('should throw error for invalid refresh token', async () => {
      vi.mocked(authInternal.verifyRefreshToken).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken('invalid-token')).rejects.toThrow(AppError);
    });
  });
});
