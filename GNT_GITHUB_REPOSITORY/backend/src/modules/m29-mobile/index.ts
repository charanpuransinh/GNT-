/**
 * M29 — Mobile Auth & Push
 * index.ts — Public M29 exports.
 *
 * Sync (offline-sync/sync-queue/conflict-resolution/sync-status), mobile
 * session management, and the mobile route descriptors from the original
 * blueprint are intentionally NOT exported — see M29_INTEGRATION_NOTES.md.
 */

export { MobileAuthService, mobileAuthService, MobileAuthError, type MobileLoginCredentials, type MobileAuthTokens, type AuthBackend } from './api/mobile-auth.service';
export { PushNotificationService, pushNotificationService, type PushMessage, type PushProvider } from './notification/push-notification.service';
