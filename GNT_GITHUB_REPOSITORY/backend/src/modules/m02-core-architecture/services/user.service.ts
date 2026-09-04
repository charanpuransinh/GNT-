import { Prisma } from '@prisma/client';
import { userRepository } from '../repositories/user.repository';
import { authInternal } from './auth.internal';

/** नया user बनाने के लिए ज़रूरी जानकारी (पहले यह `any` थी) */
export interface CreateUserInput {
  name: string;
  email: string;
  username: string;
  password: string;
  companyCode: string;
  branchId?: string | null;
}

/** user बदलने के लिए — सब वैकल्पिक, जो भेजा वही बदलेगा */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  branchId?: string | null;
  isActive?: boolean;
  password?: string;
}
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';

export const userService = {
  async listUsers(companyId: string) {
    return userRepository.findByCompanyId(companyId);
  },

  // ─────────────────────────────────────────────────────────────────
  // 2026-09-04 — यहाँ तीन असली गड़बड़ियाँ थीं, तीनों ठीक की गईं:
  //
  // 1. `deleteUser` चलते वक़्त फटता था — `{ isActive: false }` भेजता था जबकि
  //    schema में field `is_active` है। repository के `data: any` ने इसे छिपा
  //    रखा था, इसलिए न tsc पकड़ता था न कोई test। चलाकर पकड़ा:
  //    PrismaClientValidationError — यानी "user हटाना" कभी काम ही नहीं करता था।
  //
  // 2. किसी भी काम में company की जाँच नहीं थी — सिर्फ़ id से चलता था। यानी एक
  //    company का user दूसरी company के user को बदल/निष्क्रिय कर सकता था, बस id
  //    जानकर। अब हर काम companyId माँगता है।
  //
  // 3. `data: any` हर जगह — अब असली types, ताकि ग़लत field नाम compile पर ही पकड़ा जाए।
  // ─────────────────────────────────────────────────────────────────

  async getUserById(id: string, companyId: string) {
    const user = await userRepository.findById(id);
    // company की जाँच सेवा-परत पर: दूसरी company का user "नहीं मिला" ही माना जाएगा —
    // "मना है" कहने से यह पता चल जाता कि वो id मौजूद है (जानकारी का रिसाव)।
    if (!user || user.company_id !== companyId) {
      throw new AppError('GNT-ERR-2006', 'User not found', 404);
    }
    return user;
  },

  async createUser(data: CreateUserInput, companyId: string) {
    const existing = await userRepository.findByUsernameAndCompany(data.username, data.companyCode);
    if (existing) {
      throw new AppError('GNT-ERR-2009', 'Username already exists', 409);
    }

    const password_hash = await authInternal.hashPassword(data.password);

    return userRepository.create({
      company_id: companyId,
      branch_id: data.branchId ?? null,
      name: data.name,
      email: data.email,
      username: data.username,
      password_hash,
    });
  },

  async updateUser(id: string, companyId: string, data: UpdateUserInput) {
    await userService.getUserById(id, companyId); // न मिले या दूसरी company का हो → 404

    const patch: Prisma.user_masterUncheckedUpdateInput = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.email !== undefined) patch.email = data.email;
    if (data.branchId !== undefined) patch.branch_id = data.branchId;
    if (data.isActive !== undefined) patch.is_active = data.isActive;
    if (data.password) patch.password_hash = await authInternal.hashPassword(data.password);

    const updated = await userRepository.update(id, companyId, patch);
    if (!updated) throw new AppError('GNT-ERR-2006', 'User not found', 404);
    return updated;
  },

  async deleteUser(id: string, companyId: string) {
    await userService.getUserById(id, companyId);

    // Soft delete — मिटाते नहीं, सिर्फ़ निष्क्रिय करते हैं
    const updated = await userRepository.update(id, companyId, { is_active: false });
    if (!updated) throw new AppError('GNT-ERR-2006', 'User not found', 404);
    return updated;
  },
};
