# M29 — Mobile Auth & Push — wiring status

Updated 2026-09-12.

## Dropped as duplicates — NOT copied into this module
- `sync/offline-sync.service.ts`, `sync/sync-queue.service.ts`,
  `sync/conflict-resolution.service.ts`, `sync/sync-status.service.ts` —
  M15-sync already has a real, working `sync-queue.service.ts` and
  `conflict.service.ts`. A second sync/conflict system for "mobile" would
  fully duplicate M15's domain rather than extend it.
- `api/mobile-session.service.ts` (+ its `mobile_session` table concept) —
  M03-device-platform already owns device/session tracking for real:
  `device_registry` + `active_session` Prisma models, `deviceService`
  (registerDevice, getActiveSessions, terminateSession, terminateAllSessions).
  A mobile client's session is just another device session.
- `api/mobile-api.routes.ts` — its route descriptors pointed at the
  sync/session endpoints above (`M29.SYNC.MANAGE` etc., fictional
  permission strings too); with that functionality dropped/reshaped, the
  descriptor list no longer applies.

## What's wired
- `api/mobile-auth.service.ts` — real login/refresh via M02's
  `authService.login()`/`authService.refreshToken()`. Reshaped to match the
  real `LoginRequest` contract (requires `companyCode`); the blueprint's
  separate `issueTokens(userId, tenantId, deviceId)` step was dropped —
  JWTs aren't device-scoped in this repo, login issues tokens directly.
- `notification/push-notification.service.ts` — kept as shipped. Verified
  no push library (firebase-admin/apn/web-push) exists anywhere in
  `package.json`; `UnconfiguredPushProvider` (returns `delivered: false`)
  is the correct, honest default until a real provider is chosen.

## Verified, NOT wired — real shape mismatch, not guessed
The blueprint's `deviceId` -> `deviceService.registerDevice()` link was
NOT built: `registerDevice(userId, data)` matches/creates a device row by
`deviceName` and needs real `model`/`platform`/`osVersion`/`appVersion` —
a bare login-time `deviceId` string has nothing to fill those with, and
fabricating values would be guessing. Full device registration with real
metadata remains a separate, real M03 call the mobile client makes
directly; not synthesized here.
