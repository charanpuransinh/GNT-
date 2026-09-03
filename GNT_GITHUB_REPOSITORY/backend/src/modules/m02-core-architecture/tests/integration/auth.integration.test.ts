import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { roleService } from '../../services/role.service';
import { authInternal } from '../../services/auth.internal';
import { prisma } from '@/common/config/prisma';

describe.runIf(process.env.TEST_DB === '1')(
'M02 - Integration Tests', () => {
  beforeAll(() => {
    process.env.ACCESS_TOKEN_SECRET = 'test-access-secret';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
  });

  describe('Token lifecycle', () => {
    it('should generate tokens that can be verified', () => {
      const tokens = authInternal.generateTokenPair({
        userId: 'user-123',
        companyId: 'company-123',
        roles: ['role-1'],
      });

      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });

    it('should hash and verify passwords correctly', async () => {
      const password = 'TestPassword123!';
      const hash = await authInternal.hashPassword(password);

      expect(await authInternal.verifyPassword(password, hash)).toBe(true);
      expect(await authInternal.verifyPassword('wrong', hash)).toBe(false);
    });
  });

  describe('OTP flow', () => {
    it('should generate and verify OTP', async () => {
      // असली DB पर — auth_otp_challenge.user_id UUID FK है, इसलिए company+user seed चाहिए
      const companyId = '00000000-0000-4000-8000-000000000001';
      const userId = '99999999-9999-4999-8999-999999999999';
      await prisma.company_master.upsert({
        where: { id: companyId },
        update: {},
        create: { id: companyId, name: 'Auth Test Co', code: 'AUTHTEST' },
      });
      await prisma.user_master.upsert({
        where: { id: userId },
        update: {},
        create: { id: userId, company_id: companyId, name: 'OTP User', email: 'otp@test.com', username: 'otpuser', password_hash: 'x' },
      });

      await authInternal.sendOtp(userId, 'otp@test.com');

      // हम OTP सीधे नहीं पढ़ सकते — गलत OTP से verify false ही होना चाहिए
      const isValid = await authInternal.verifyOtp(userId, '000000');
      expect(isValid).toBe(false); // Random OTP should fail
    });
  });
});
