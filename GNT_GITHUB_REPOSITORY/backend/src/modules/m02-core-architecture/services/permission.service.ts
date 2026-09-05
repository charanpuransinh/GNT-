// ============================================================================
// किस user के पास कौन सी अनुमतियाँ हैं — इसका इकलौता जवाब देने वाला
//
// token में भूमिका की id पड़ी होती है, पर उस पर भरोसा नहीं किया जाता: token 15 मिनट
// चलता है, और उतनी देर में मालिक किसी की भूमिका बदल सकता है। इसलिए अनुमतियाँ हमेशा
// database से आती हैं — बीच में एक छोटी सी (30 सेकंड) याददाश्त है ताकि हर request पर
// query न चले।
// ============================================================================

import { roleRepository } from '../repositories/role.repository';
import type { PermissionKey } from '@/common/auth/permission-catalog';

const CACHE_TTL_MS = 30_000;

interface CacheEntry { permissions: Set<PermissionKey>; expiresAt: number }
const cache = new Map<string, CacheEntry>();

export const permissionService = {
  /** इस user की सारी अनुमतियाँ (`module:action`) — भूमिकाओं से जोड़कर */
  async getUserPermissions(userId: string): Promise<Set<PermissionKey>> {
    const cached = cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) return cached.permissions;

    const list = await roleRepository.getPermissionsByUserId(userId);
    const permissions = new Set<PermissionKey>(list);
    cache.set(userId, { permissions, expiresAt: Date.now() + CACHE_TTL_MS });
    return permissions;
  },

  async hasPermission(userId: string, key: PermissionKey): Promise<boolean> {
    return (await this.getUserPermissions(userId)).has(key);
  },

  /**
   * किसी user की भूमिका बदली हो तो उसकी याददाश्त तुरंत मिटाओ — वरना 30 सेकंड तक
   * पुरानी अनुमतियाँ चलती रहेंगी (हटाई गई अनुमति भी)।
   */
  invalidateUser(userId: string): void {
    cache.delete(userId);
  },

  /** भूमिका की अनुमतियाँ बदलीं — किस-किस user पर असर है यह पता नहीं, इसलिए सब मिटाओ */
  invalidateAll(): void {
    cache.clear();
  },
};
