import { userRepository } from '../repositories/user.repository';
import { roleRepository } from '../repositories/role.repository';
import { authInternal } from './auth.internal';
import {
  LoginRequest,
  LoginResponse,
  OTPVerifyRequest,
  OTPVerifyResponse,
  Role,
  UserProfile,
  TokenPair,
} from '../types/auth.types';
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';

export const authService = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    // 1. Find user by username + company code
    const user = await userRepository.findByUsernameAndCompany(
      data.username,
      data.companyCode
    );

    if (!user) {
      throw new AppError('GNT-ERR-2002', 'Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('GNT-ERR-2003', 'Account is disabled', 403);
    }

    // 2. Verify password
    const isValidPassword = await authInternal.verifyPassword(
      data.password,
      user.password_hash
    );

    if (!isValidPassword) {
      await userRepository.incrementFailedAttempts(user.id);
      throw new AppError('GNT-ERR-2002', 'Invalid credentials', 401);
    }

    // 3. Check if account is locked due to failed attempts
    if (user.failed_login_attempts >= 5) {
      throw new AppError('GNT-ERR-2004', 'Account locked due to too many failed attempts', 403);
    }

    // 4. Reset failed attempts on successful password
    await userRepository.resetFailedAttempts(user.id);

    // 5. Get user roles and permissions
    const roles = await roleRepository.getRolesByUserId(user.id);
    const permissions = await roleRepository.getPermissionsByUserId(user.id);

    // 6. Generate tokens
    const tokens = await authInternal.generateTokenPair({
      userId: user.id,
      companyId: user.company_id,
      roles: roles.map((r) => r.id),
    });

    // 7. Update last login
    await userRepository.updateLastLogin(user.id);

    // 8. Check if OTP is required
    const requiresOtp = user.two_factor_enabled || authInternal.isHighRiskLogin(user);

    if (requiresOtp) {
      await authInternal.sendOtp(user.id, user.email);
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar ?? undefined,
        roles: roles.map((r): Role => ({ id: r.id, name: r.name, description: r.description ?? '', permissions: [] })),
        permissions,
        companyId: user.company_id,
        branchId: user.branch_id ?? undefined,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at?.toISOString(),
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      requiresOtp,
      roles: roles.map((r): Role => ({ id: r.id, name: r.name, description: r.description ?? '', permissions: [] })),
    };
  },

  async verifyOtp(data: OTPVerifyRequest): Promise<OTPVerifyResponse> {
    const isValid = await authInternal.verifyOtp(data.userId, data.otp);

    if (!isValid) {
      throw new AppError('GNT-ERR-2005', 'Invalid or expired OTP', 401);
    }

    const user = await userRepository.findById(data.userId);
    if (!user) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }

    const roles = await roleRepository.getRolesByUserId(user.id);
    const permissions = await roleRepository.getPermissionsByUserId(user.id);

    const tokens = await authInternal.generateTokenPair({
      userId: user.id,
      companyId: user.company_id,
      roles: roles.map((r) => r.id),
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatar: user.avatar ?? undefined,
        roles: roles.map((r): Role => ({ id: r.id, name: r.name, description: r.description ?? '', permissions: [] })),
        permissions,
        companyId: user.company_id,
        branchId: user.branch_id ?? undefined,
        isActive: user.is_active,
        lastLoginAt: user.last_login_at?.toISOString(),
      },
    };
  },

  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload = await authInternal.verifyRefreshToken(refreshToken);
    const user = await userRepository.findById(payload.userId);

    if (!user || !user.is_active) {
      throw new AppError('GNT-ERR-2007', 'Invalid refresh token', 401);
    }

    const roles = await roleRepository.getRolesByUserId(user.id);
    return authInternal.generateTokenPair({
      userId: user.id,
      companyId: user.company_id,
      roles: roles.map((r) => r.id),
    });
  },

  async logout(userId: string): Promise<void> {
    await authInternal.revokeTokens(userId);
  },

  async getCurrentUser(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }

    const roles = await roleRepository.getRolesByUserId(user.id);
    const permissions = await roleRepository.getPermissionsByUserId(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      username: user.username,
      avatar: user.avatar ?? undefined,
      roles: roles.map((r): Role => ({ id: r.id, name: r.name, description: r.description ?? '', permissions: [] })),
      permissions,
      companyId: user.company_id,
      branchId: user.branch_id ?? undefined,
      isActive: user.is_active,
      lastLoginAt: user.last_login_at?.toISOString(),
    };
  },

  async unlockSession(userId: string, pin: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }

    const isValidPin = await authInternal.verifyPin(userId, pin);
    if (!isValidPin) {
      throw new AppError('GNT-ERR-2008', 'Invalid PIN', 401);
    }
  },
};
