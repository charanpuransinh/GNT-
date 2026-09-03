// ============================================================================
// M02 — auth/permission/session schemas के unit tests (टास्क #024 — C3)
// login की चाबी companyCode = company_master.code (CERT-003 शर्त 1 / C2) —
// यही यहाँ जाँची जाती है। सब pure (Zod), DB नहीं चाहिए।
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import {
  loginSchema,
  otpVerifySchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  createRoleSchema,
  updateRoleSchema,
} from '../../validators/auth.schema';

describe('loginSchema (login की चाबी companyCode)', () => {
  it('सही login मंज़ूर — username/password/companyCode', () => {
    const r = loginSchema.safeParse({ username: 'ramu', password: 'secret1', companyCode: 'PURANSTORE' });
    assert.equal(r.success, true);
  });

  it('companyCode ज़रूरी है (code ही कंपनी की पहचान है, GSTIN नहीं)', () => {
    assert.equal(loginSchema.safeParse({ username: 'ramu', password: 'secret1' }).success, false);
  });

  it('companyCode की सीमा 2..20 (छोटा, इंसान के लिखने लायक़ code)', () => {
    assert.equal(loginSchema.safeParse({ username: 'ramu', password: 'secret1', companyCode: 'A' }).success, false);
    assert.equal(
      loginSchema.safeParse({ username: 'ramu', password: 'secret1', companyCode: 'A'.repeat(21) }).success,
      false,
    );
    assert.equal(
      loginSchema.safeParse({ username: 'ramu', password: 'secret1', companyCode: 'AB' }).success,
      true,
    );
  });

  it('password कम से कम 6 अक्षर', () => {
    assert.equal(loginSchema.safeParse({ username: 'ramu', password: '12345', companyCode: 'AB' }).success, false);
  });
});

describe('otpVerifySchema (session/OTP)', () => {
  it('6 अंकों का OTP + uuid userId', () => {
    const r = otpVerifySchema.safeParse({ userId: '550e8400-e29b-41d4-a716-446655440000', otp: '123456' });
    assert.equal(r.success, true);
  });

  it('अक्षर वाला OTP रद्द', () => {
    assert.equal(
      otpVerifySchema.safeParse({ userId: '550e8400-e29b-41d4-a716-446655440000', otp: '12ab56' }).success,
      false,
    );
  });
});

describe('refreshTokenSchema (session)', () => {
  it('खाली refresh token रद्द', () => {
    assert.equal(refreshTokenSchema.safeParse({ refreshToken: '' }).success, false);
  });
});

describe('createRoleSchema / updateRoleSchema (permissions)', () => {
  it('नई भूमिका के लिए कम से कम... permissionIds array ज़रूरी', () => {
    assert.equal(createRoleSchema.safeParse({ name: 'Admin', companyId: '550e8400-e29b-41d4-a716-446655440000' }).success, false);
    assert.equal(
      createRoleSchema.safeParse({
        name: 'Admin',
        companyId: '550e8400-e29b-41d4-a716-446655440000',
        permissionIds: ['550e8400-e29b-41d4-a716-446655440000'],
      }).success,
      true,
    );
  });

  it('भूमिका बदलते वक़्त सब optional', () => {
    assert.equal(updateRoleSchema.safeParse({ description: 'बदली हुई' }).success, true);
  });
});

describe('createUserSchema / updateUserSchema (user + role binding)', () => {
  it('नया user: कम से कम 1 role ज़रूरी, password 8+', () => {
    const base = {
      name: 'राम',
      email: 'ram@example.com',
      username: 'ramu',
      password: '12345678',
      companyId: '550e8400-e29b-41d4-a716-446655440000',
      roleIds: ['550e8400-e29b-41d4-a716-446655440000'],
    };
    assert.equal(createUserSchema.safeParse(base).success, true);
    assert.equal(createUserSchema.safeParse({ ...base, roleIds: [] }).success, false);
    assert.equal(createUserSchema.safeParse({ ...base, password: '1234567' }).success, false);
  });

  it('user बदलते वक़्त password optional', () => {
    assert.equal(updateUserSchema.safeParse({ name: 'नया नाम' }).success, true);
  });
});
