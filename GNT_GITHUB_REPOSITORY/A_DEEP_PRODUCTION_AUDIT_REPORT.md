# A --- Deep Production Audit Report

## Scope

**Archive audited:** `Tim A.zip`\
**Functional scope:** M01 Foundation, M02 Core Architecture, M03 Device
Platform\
**M04/M05:** Out of scope and not counted as missing.\
**Audit type:** Source/code, packaging, security, database, wiring,
test-coverage and production-readiness review.

## Executive verdict

**Production readiness: \~75% --- NOT READY FOR DIRECT PRODUCTION
DEPLOYMENT.**

The architecture is reasonably mature and the package contains M01--M03
frontend/backend/database/wiring artifacts. The main production blockers
are concentrated in **M02 authentication/security**, environment-secret
handling, and the presence of multiple overlapping package variants.

### Severity summary

  Severity        Finding
  ------------- ---------
  🔴 Critical           1
  🔴 High               4
  🟠 Medium             5
  🟡 Low                3

------------------------------------------------------------------------

## 🔴 CRITICAL

### A-SEC-001 --- RS256 is configured with symmetric string secrets

**File:**
`m02new/backend/src/modules/m02-core-architecture/services/auth.internal.ts`

**Problem:** `jwt.sign()` is configured with `algorithm: 'RS256'`, but
the signing key is loaded from `ACCESS_TOKEN_SECRET` /
`REFRESH_TOKEN_SECRET` as ordinary strings. RS256 requires an RSA
private key for signing and the corresponding public key for
verification.

**Impact:** Authentication can fail at runtime or be incorrectly
configured in deployment. This is a security and availability blocker.

**Required fix:** - Use `ACCESS_TOKEN_PRIVATE_KEY` and
`REFRESH_TOKEN_PRIVATE_KEY` for signing. - Use corresponding public keys
for verification. - Pin the allowed algorithm to RS256. - Store keys in
a production secret manager. - Add startup validation that refuses to
boot if production keys are absent/invalid.

**Acceptance test:** A production-like environment can sign and verify
access/refresh tokens across separate processes using only the
configured RSA key material.

------------------------------------------------------------------------

## 🔴 HIGH

### A-SEC-002 --- Hard-coded development JWT fallbacks

**Files:** -
`m02new/backend/src/modules/m02-core-architecture/services/auth.internal.ts` -
`backend/src/common/config/env-config.ts`

**Problem:** Fallback values include `dev-access-secret`,
`dev-refresh-secret`, and `dev-only-secret-change-me`.

**Impact:** A misconfigured production deployment can silently run with
known credentials.

**Required fix:** No secret fallback in production. Fail startup if
required secrets are missing. Allow explicit test-only defaults only
when `NODE_ENV=test`.

------------------------------------------------------------------------

### A-SEC-003 --- OTP is process-local memory

**File:**
`m02new/backend/src/modules/m02-core-architecture/services/auth.internal.ts`

**Problem:** OTPs are stored in a JavaScript `Map`.

**Impact:** OTP state disappears on restart and is not shared across
multiple instances.

**Required fix:** Redis-backed OTP storage with TTL, attempt counter,
atomic consume/delete, and rate limiting.

------------------------------------------------------------------------

### A-SEC-004 --- PIN verification is a placeholder

**File:**
`m02new/backend/src/modules/m02-core-architecture/services/auth.internal.ts`

**Problem:** `verifyPin()` effectively accepts any PIN with length \>=
4.

**Impact:** This is an authentication bypass if this path is reachable
in production.

**Required fix:** Store a salted PIN hash and verify using a
password/PIN hashing function. Add lockout/rate-limit controls and audit
logging.

------------------------------------------------------------------------

### A-SEC-005 --- Token revocation is not implemented

**File:**
`m02new/backend/src/modules/m02-core-architecture/services/auth.internal.ts`

**Problem:** `revokeTokens()` only logs a message.

**Impact:** Logout/revocation cannot reliably invalidate outstanding
refresh/access tokens.

**Required fix:** Redis/JTI-based revocation or server-side
refresh-session store with TTL. Verify revocation on refresh and, where
required, access-token validation.

------------------------------------------------------------------------

## 🟠 MEDIUM

### A-SEC-006 --- High-risk login detection is a stub

**File:**
`m02new/backend/src/modules/m02-core-architecture/services/auth.internal.ts`

`isHighRiskLogin()` always returns `false`.

**Required fix:** Implement a real policy using device/session history,
IP/ASN signals, time anomaly, failed attempts and configurable
thresholds. At minimum, make the function fail closed for explicitly
configured high-risk conditions.

------------------------------------------------------------------------

### A-CONFIG-001 --- Multiple environment/config sources

There are both generic environment configuration and M02-specific token
configuration.

**Risk:** Different modules can validate different configuration sets.

**Fix:** Create one authoritative production config module and validate
it at startup.

------------------------------------------------------------------------

### A-PKG-001 --- Multiple overlapping package variants

The archive contains: - `M01_Foundation.zip` -
`M02_Core_Architecture.zip` - `M03_Device_Platform.zip` -
`gnt_team_a_m01_m02_wired.zip` - `gnt_team_a_m01_m02_m03_wired.zip`

After extraction, overlapping trees such as `m01new`, `m02new`, and root
frontend/backend trees are present.

**Risk:** Developers/deployment pipelines may build the wrong copy.

**Fix:** Define one canonical source tree and move all superseded
variants into an explicit archive/legacy folder outside the deployable
source.

------------------------------------------------------------------------

### A-DB-001 --- Database artifacts need one authoritative migration path

The package contains M01/M02/M03 schemas and migrations, but the
multiple package variants make it unclear which migration directory is
authoritative.

**Fix:** Consolidate schemas/migrations into one canonical migration
history and run `prisma validate`/migration checks against a clean
database.

------------------------------------------------------------------------

### A-TEST-001 --- Test suite exists, but production CI gate is not proven

The archive contains tests, but the audit did not certify a successful
clean install + typecheck + build + integration test run.

**Fix:** CI must run: 1. clean dependency install 2. typecheck 3.
frontend build 4. backend build 5. migration validation 6. unit tests 7.
integration tests 8. security/auth tests

------------------------------------------------------------------------

## 🟡 LOW

### A-OPS-001 --- Production observability needs explicit verification

Confirm structured logs, correlation IDs, error redaction, metrics and
health/readiness endpoints in the actual deployment configuration.

### A-OPS-002 --- Secret/key rotation procedure is not evidenced

Document rotation for JWT keys, database credentials and Redis
credentials.

### A-OPS-003 --- Deployment artifact needs a single release manifest

Add release version, commit SHA, migration version and module versions
to the final artifact.

------------------------------------------------------------------------

## What is already good

-   M01--M03 are present.
-   Frontend/backend separation is clear.
-   M01/M02/M03 wiring maps exist.
-   Database schemas and migration artifacts exist.
-   Tests are present.
-   The project has a root `package.json` and TypeScript configs.
-   M04/M05 are correctly treated as **out of scope**.

## Production gate for A

**BLOCKED until A-SEC-001 through A-SEC-005 are closed.**

After those fixes, run the complete CI gate and an external security
review of authentication.

------------------------------------------------------------------------
