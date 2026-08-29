import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import { logger } from '@/common/logging/logger';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const OTP_EXPIRY_MINUTES = 10;

function key(name: string): string {
  const value = process.env[name];
  if (value) return value.replace(/\\n/g, '\n');
  if (process.env.NODE_ENV === 'test') return testKeyPair()[name.includes('PRIVATE') ? 'private' : 'public'];
  throw new Error(`Missing required production authentication key: ${name}`);
}

let generatedTestKeys: { private: string; public: string } | undefined;
function testKeyPair() {
  if (generatedTestKeys) return generatedTestKeys;
  const { generateKeyPairSync } = require('node:crypto');
  const pair = generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });
  generatedTestKeys = { private: pair.privateKey, public: pair.publicKey };
  return generatedTestKeys;
}

const accessPrivateKey = () => key('ACCESS_TOKEN_PRIVATE_KEY');
const accessPublicKey = () => key('ACCESS_TOKEN_PUBLIC_KEY');
const refreshPrivateKey = () => key('REFRESH_TOKEN_PRIVATE_KEY');
const refreshPublicKey = () => key('REFRESH_TOKEN_PUBLIC_KEY');

async function isRevoked(userId: string, issuedAtSeconds?: number): Promise<boolean> {
  if (!issuedAtSeconds) return true;
  try {
    const rows = await prisma.$queryRaw<Array<{ revoked_after: Date | null }>>(Prisma.sql`
      SELECT revoked_after FROM auth_user_revocation WHERE user_id = ${userId} LIMIT 1
    `);
    const revokedAfter = rows[0]?.revoked_after;
    return !!revokedAfter && issuedAtSeconds * 1000 <= revokedAfter.getTime();
  } catch (error) {
    if (process.env.NODE_ENV === 'test') return false;
    logger.error('Authentication revocation check failed closed', { error });
    return true;
  }
}

export const authInternal = {
  async hashPassword(password: string): Promise<string> { return bcrypt.hash(password, 12); },
  async verifyPassword(password: string, hash: string): Promise<boolean> { return bcrypt.compare(password, hash); },

  generateTokenPair(payload: { userId: string; companyId: string; roles: string[] }): { accessToken: string; refreshToken: string } {
    const sessionId = randomUUID();
    const accessToken = jwt.sign({ ...payload, type: 'access', sessionId }, accessPrivateKey(), { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: 'RS256' });
    const refreshToken = jwt.sign({ userId: payload.userId, companyId: payload.companyId, roles: payload.roles, type: 'refresh', sessionId }, refreshPrivateKey(), { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: 'RS256' });
    return { accessToken, refreshToken };
  },

  async verifyAccessToken(token: string): Promise<any> {
    const payload: any = jwt.verify(token, accessPublicKey(), { algorithms: ['RS256'] });
    if (payload.type !== 'access' || await isRevoked(payload.userId, payload.iat)) throw new Error('Access token revoked');
    return payload;
  },

  async verifyRefreshToken(token: string): Promise<any> {
    const payload: any = jwt.verify(token, refreshPublicKey(), { algorithms: ['RS256'] });
    if (payload.type !== 'refresh' || await isRevoked(payload.userId, payload.iat)) throw new Error('Refresh token revoked');
    return payload;
  },

  async sendOtp(userId: string, email: string): Promise<void> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO auth_otp_challenge (user_id, email, otp_hash, expires_at, attempts)
      VALUES (${userId}, ${email}, ${otpHash}, ${expiresAt}, 0)
      ON CONFLICT (user_id) DO UPDATE SET email = EXCLUDED.email, otp_hash = EXCLUDED.otp_hash, expires_at = EXCLUDED.expires_at, attempts = 0
    `);
    if (process.env.NODE_ENV === 'test') logger.info(`Test OTP generated for user ${userId}`, { expiresAt, otp });
    else if (process.env.M16_OTP_DELIVERY_URL) {
      const response = await fetch(process.env.M16_OTP_DELIVERY_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId, email, otp }) });
      if (!response.ok) throw new Error(`OTP delivery failed with status ${response.status}`);
    } else throw new Error('Production OTP delivery provider is not configured');
  },

  async verifyOtp(userId: string, otp: string): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ id: string; otp_hash: string; expires_at: Date; attempts: number }>>(Prisma.sql`
      SELECT id, otp_hash, expires_at, attempts FROM auth_otp_challenge WHERE user_id = ${userId} LIMIT 1
    `);
    const record = rows[0];
    if (!record || record.expires_at <= new Date() || record.attempts >= 5) return false;
    const valid = await bcrypt.compare(otp, record.otp_hash);
    if (!valid) { await prisma.$executeRaw(Prisma.sql`UPDATE auth_otp_challenge SET attempts = attempts + 1 WHERE id = ${record.id}`); return false; }
    await prisma.$executeRaw(Prisma.sql`DELETE FROM auth_otp_challenge WHERE id = ${record.id}`);
    return true;
  },

  async verifyPin(userId: string, pin: string): Promise<boolean> {
    if (!/^\d{4,8}$/.test(pin)) return false;
    const rows = await prisma.$queryRaw<Array<{ pin_hash: string | null }>>(Prisma.sql`SELECT pin_hash FROM user_master WHERE id = ${userId} LIMIT 1`);
    return !!rows[0]?.pin_hash && await bcrypt.compare(pin, rows[0].pin_hash);
  },

  isHighRiskLogin(user: any): boolean {
    return user?.riskScore != null ? Number(user.riskScore) >= 70 : false;
  },

  async revokeTokens(userId: string): Promise<void> {
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO auth_user_revocation (user_id, revoked_after) VALUES (${userId}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET revoked_after = EXCLUDED.revoked_after
    `);
  },
};
