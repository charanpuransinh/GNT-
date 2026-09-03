// GNT — test helper: असली JWT token + test IDs (DB-gated tests के लिए)
// authInternal.generateTokenPair टेस्ट env में generated key-pair से token बनाता है
// और verifyAccessToken उसी pair से verify करता है — DB-gated API tests यही use करें।
import { authInternal } from '@/modules/m02-core-architecture/services/auth.internal';

export const TEST_COMPANY_ID = '00000000-0000-4000-8000-000000000001';
export const TEST_USER_ID = '00000000-0000-4000-8000-000000000002';

export function mintBearer(companyId: string = TEST_COMPANY_ID, userId: string = TEST_USER_ID): string {
  const { accessToken } = authInternal.generateTokenPair({ userId, companyId, roles: ['ADMIN'] });
  return `Bearer ${accessToken}`;
}
