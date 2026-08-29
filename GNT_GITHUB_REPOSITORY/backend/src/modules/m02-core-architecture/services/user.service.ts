import { userRepository } from '../repositories/user.repository';
import { authInternal } from './auth.internal';
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';

export const userService = {
  async listUsers(companyId: string) {
    return userRepository.findByCompanyId(companyId);
  },

  async getUserById(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }
    return user;
  },

  async createUser(data: any) {
    // Check if username already exists
    const existing = await userRepository.findByUsernameAndCompany(
      data.username,
      data.companyId
    );
    if (existing) {
      throw new AppError('GNT-ERR-2009', 'Username already exists', 409);
    }

    // Hash password
    const passwordHash = await authInternal.hashPassword(data.password);

    return userRepository.create({
      ...data,
      passwordHash,
    });
  },

  async updateUser(id: string, data: any) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }

    // If password is being updated, hash it
    if (data.password) {
      data.passwordHash = await authInternal.hashPassword(data.password);
      delete data.password;
    }

    return userRepository.update(id, data);
  },

  async deleteUser(id: string) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }

    // Soft delete — don't actually remove, just deactivate
    return userRepository.update(id, { isActive: false });
  },
};
