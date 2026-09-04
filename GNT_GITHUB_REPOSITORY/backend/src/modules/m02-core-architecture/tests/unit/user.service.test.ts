// ============================================================================
// M02 — userService के unit tests
//
// 2026-09-04 को पूरी फ़ाइल दोबारा लिखी गई। पुराने tests **bug को ही सही मान रहे थे**:
//   expect(userRepository.update).toHaveBeenCalledWith('user-1', { isActive: false })
// जबकि schema में field `is_active` है। repository के `data: any` ने type-mismatch
// छिपा रखा था, इसलिए tsc भी चुप था और ये tests भी हरे थे — पर असल में "user हटाना"
// चलते वक़्त PrismaClientValidationError से फटता था। चलाकर पकड़ा।
//
// अब ये tests तीन चीज़ें पक्की करते हैं:
//   1. field के नाम schema वाले ही जाएँ (snake_case)
//   2. हर काम company से बँधा हो — दूसरी company का user छुआ न जा सके
//   3. न मिलने और दूसरी company का होने, दोनों पर एक जैसा 404 (जानकारी का रिसाव नहीं)
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { userService } from '../../services/user.service';
import { userRepository } from '../../repositories/user.repository';
import { authInternal } from '../../services/auth.internal';
import { AppError } from '@/common/errors/error-classes';

vi.mock('../../repositories/user.repository');
vi.mock('../../services/auth.internal');

const COMPANY = 'company-123';
const OTHER_COMPANY = 'company-999';

describe('M02 - userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listUsers', () => {
    it('अपनी company के users लौटाता है', async () => {
      const mockUsers = [{ id: 'user-1', company_id: COMPANY }];
      vi.mocked(userRepository.findByCompanyId).mockResolvedValue(mockUsers as never);

      const result = await userService.listUsers(COMPANY);

      expect(result).toEqual(mockUsers);
      expect(userRepository.findByCompanyId).toHaveBeenCalledWith(COMPANY);
    });
  });

  describe('getUserById', () => {
    it('अपनी company का user मिलता है', async () => {
      const mockUser = { id: 'user-1', username: 'testuser', company_id: COMPANY };
      vi.mocked(userRepository.findById).mockResolvedValue(mockUser as never);

      await expect(userService.getUserById('user-1', COMPANY)).resolves.toEqual(mockUser);
    });

    it('🔒 दूसरी company का user "नहीं मिला" ही माना जाए', async () => {
      // यही असली सुरक्षा-जाँच है: user मौजूद है, पर किसी और company का।
      // "मना है" कहने से पता चल जाता कि वो id असल में मौजूद है — इसलिए 404 ही सही है।
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 'user-1',
        company_id: OTHER_COMPANY,
      } as never);

      await expect(userService.getUserById('user-1', COMPANY)).rejects.toThrow(AppError);
    });

    it('user न मिले तो AppError', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as never);

      await expect(userService.getUserById('missing-id', COMPANY)).rejects.toThrow(AppError);
    });
  });

  describe('createUser', () => {
    const input = {
      name: 'New User',
      email: 'new@example.com',
      username: 'newuser',
      password: 'plain-pass',
      companyCode: 'ACME',
    };

    it('password hash करके, schema वाले नामों से user बनाता है', async () => {
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(null as never);
      vi.mocked(authInternal.hashPassword).mockResolvedValue('hashed-pass' as never);
      vi.mocked(userRepository.create).mockResolvedValue({ id: 'user-2' } as never);

      await userService.createUser(input, COMPANY);

      expect(authInternal.hashPassword).toHaveBeenCalledWith('plain-pass');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'newuser',
          password_hash: 'hashed-pass', // snake_case — पुराना test यहाँ camelCase माँगता था
          company_id: COMPANY,
        }),
      );
    });

    it('🔒 company बुलाने वाले से आती है, request के body से नहीं', async () => {
      // वरना कोई body में दूसरी company की id भेजकर वहाँ user बना सकता था
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue(null as never);
      vi.mocked(authInternal.hashPassword).mockResolvedValue('h' as never);
      vi.mocked(userRepository.create).mockResolvedValue({ id: 'user-3' } as never);

      await userService.createUser({ ...input, company_id: OTHER_COMPANY } as never, COMPANY);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ company_id: COMPANY }),
      );
    });

    it('username पहले से हो तो AppError', async () => {
      vi.mocked(userRepository.findByUsernameAndCompany).mockResolvedValue({ id: 'existing' } as never);

      await expect(userService.createUser(input, COMPANY)).rejects.toThrow(AppError);
    });
  });

  describe('updateUser', () => {
    it('password दिया हो तो दोबारा hash करके password_hash में रखता है', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ id: 'user-1', company_id: COMPANY } as never);
      vi.mocked(authInternal.hashPassword).mockResolvedValue('new-hash' as never);
      vi.mocked(userRepository.update).mockResolvedValue({ id: 'user-1' } as never);

      await userService.updateUser('user-1', COMPANY, { password: 'newpass' });

      expect(authInternal.hashPassword).toHaveBeenCalledWith('newpass');
      expect(userRepository.update).toHaveBeenCalledWith(
        'user-1',
        COMPANY,
        expect.objectContaining({ password_hash: 'new-hash' }),
      );
    });

    it('जो field भेजी ही नहीं, वो छेड़ी न जाए', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ id: 'user-1', company_id: COMPANY } as never);
      vi.mocked(userRepository.update).mockResolvedValue({ id: 'user-1' } as never);

      await userService.updateUser('user-1', COMPANY, { name: 'बदला हुआ नाम' });

      expect(userRepository.update).toHaveBeenCalledWith('user-1', COMPANY, { name: 'बदला हुआ नाम' });
    });

    it('🔒 दूसरी company का user बदला न जा सके', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 'user-1',
        company_id: OTHER_COMPANY,
      } as never);

      await expect(userService.updateUser('user-1', COMPANY, { name: 'x' })).rejects.toThrow(AppError);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('user न मिले तो AppError', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as never);

      await expect(userService.updateUser('missing-id', COMPANY, {})).rejects.toThrow(AppError);
    });
  });

  describe('deleteUser', () => {
    it('मिटाता नहीं, is_active false करता है', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({ id: 'user-1', company_id: COMPANY } as never);
      vi.mocked(userRepository.update).mockResolvedValue({ id: 'user-1' } as never);

      await userService.deleteUser('user-1', COMPANY);

      // पुराना test यहाँ `{ isActive: false }` माँगता था — वही bug था जो चलते वक़्त फटता था
      expect(userRepository.update).toHaveBeenCalledWith('user-1', COMPANY, { is_active: false });
    });

    it('🔒 दूसरी company का user हटाया न जा सके', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue({
        id: 'user-1',
        company_id: OTHER_COMPANY,
      } as never);

      await expect(userService.deleteUser('user-1', COMPANY)).rejects.toThrow(AppError);
      expect(userRepository.update).not.toHaveBeenCalled();
    });

    it('user न मिले तो AppError', async () => {
      vi.mocked(userRepository.findById).mockResolvedValue(null as never);

      await expect(userService.deleteUser('missing-id', COMPANY)).rejects.toThrow(AppError);
    });
  });
});
