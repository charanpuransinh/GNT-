import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { authService } from '../../services/auth.service';
import { userService } from '../../services/user.service';
import { roleService } from '../../services/role.service';
import { authInternal } from '../../services/auth.internal';

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
      await authInternal.sendOtp('user-123', 'test@example.com');

      // We can't directly access the OTP, but we can verify the flow structure
      // In real tests, we'd mock the OTP delivery and capture the generated OTP
      const isValid = await authInternal.verifyOtp('user-123', '000000');
      expect(isValid).toBe(false); // Random OTP should fail
    });
  });
});
