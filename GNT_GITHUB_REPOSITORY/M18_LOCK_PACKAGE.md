# M18 — EXTERNAL INTEGRATION — LOCK PACKAGE

## Module Info
- **Module ID:** M18
- **Name:** External Integration (payment/SMS/WhatsApp/email/GSTN gateways, inbound webhooks, API keys)
- **Mount:** `/api/v1` (integrations + webhooks)
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 19/19 M18 tests on live PostgreSQL (`TEST_DB=1`); typecheck clean; biome lint clean (17 files).

## P0/P1 fixed at certification
**Multi-tenant webhook routing.** `findIntegrationByProvider(provider)` returned the *oldest*
`integration_config` for a provider across **all** tenants. With two tenants using the same gateway
(e.g. both on Razorpay), an inbound webhook for tenant B was validated against tenant A's
`webhook_secret` → always 401, tenant B's real webhooks never processed.
**Fix:** per-integration webhook URL `POST /integrations/webhook/:provider/:integrationId`
(preferred — each tenant pastes their own URL into the gateway dashboard). The bare
`/integrations/webhook/:provider` now works **only** when exactly one active integration exists for
that provider; if more than one, it returns `400` telling the caller to use the per-integration URL.
New test proves: bare URL ambiguous → 400; per-integration URL + tenant B secret → 200;
per-integration URL + wrong tenant secret → 401.

## Database Ownership
`integration_config`, `webhook_log`, `api_key` (+ `integration_event_log`) — M18 OWNER.

## Public Surface (`/api/v1`)
| Method | Path | Purpose |
|--------|------|---------|
| GET/POST/PUT/DELETE | `/integrations` `/integrations/:id` | integration config CRUD (tenant-scoped) |
| POST | `/integrations/test` | test a connection |
| GET | `/integrations/status` | gateway status page data |
| POST/GET/DELETE | `/integrations/api-keys` `/integrations/api-keys/:id` | API key management (hashed at rest) |
| POST | `/integrations/webhook/:provider/:integrationId` | **inbound webhook (multi-tenant safe)** |
| POST | `/integrations/webhook/:provider` | inbound webhook (single-integration fallback) |

## Gateways (`services/gateway.service.ts`)
WhatsApp, SMS, payment, email, GSTN verify — each `(companyId, dto)` → tenant's own
`integration_config` (type-scoped). Provider credentials come from `config_json`, never hardcoded.

## Webhook processing (`services/webhook.service.ts`)
`signature check on RAW body` → `default-deny if no secret` → `JSON parse` → `dedup by event id`
→ `webhook_log` state machine (`RECEIVED → VALIDATED → PROCESSED / FAILED`) → emit
`PAYMENT_WEBHOOK_SUCCESS/FAILED` → **M11 `paymentService.confirmByProviderRef`** (real wiring).
Signature: HMAC-SHA256 (Razorpay/Stripe, Stripe with `t.` timestamp prefix), HMAC-SHA1 over
`url+params` (Twilio), all via `crypto.timingSafeEqual` with a length pre-check.

## Events
- Publishes: `WEBHOOK_RECEIVED`, `PAYMENT_WEBHOOK_SUCCESS`, `PAYMENT_WEBHOOK_FAILED`,
  `GATEWAY_STATUS_CHANGED`, `monitoring.gateway.alert` (→ M19)
- Subscribes: its own webhook events for async processing

## Security
- Integration/gateway/API-key operations: token-only identity, tenant-scoped (`company_id`)
- Webhooks: **no auth token** (external callers) — authenticity comes from the HMAC signature
  against the tenant's own secret; **default-deny** when no secret is configured
- API keys hashed at rest; `plain_key` returned once on creation only
- No stray `new PrismaClient()` (repo + services take prisma by DI)
- Raw-body middleware scoped to `/api/v1/integrations/webhook` only (signature integrity)

## Cross-Module Rules
- ✅ M18 → M11 `paymentService.confirmByProviderRef` (PUBLIC, via event) — ALLOWED
- ✅ M18 → M19 gateway alerts (event) — ALLOWED
- ❌ M18 → any module's private repo/DB — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/integration.routes.ts` + `integration.types.ts`)
- [x] Repository Map (`integration.repository.ts`)
- [x] File Registry (controllers ×2, services ×3, events ×2, repo ×1, model, validators, types)
- [x] Database Map (`integration_config`, `webhook_log`, `api_key`)
- [x] Database Registry (canonical `prisma/schema.prisma`)
- [x] Dependency Map (M11 payment confirm; M19 alerts; shared eventBus; M01/M02 auth)
- [x] Wiring Map (`wiring-maps/module-wiring/m18/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (webhook signature contract per provider; payment-confirm event contract)
- [x] Security Contract — token identity (config ops), HMAC + default-deny (webhooks), **multi-tenant webhook routing fixed**, hashed API keys, DI prisma
- [x] Test Report — 19/19 live-DB: signature accept/reject, dedup, webhook_log state, gateway signature unit tests, repository, service, **multi-tenant webhook routing (400/200/401)**
- [x] Change Log — 2026-09-08: multi-tenant webhook routing P1 fixed + test; cert pass
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- Actual outbound gateway calls (Razorpay/Twilio/etc.) require live credentials + network; in a
  restricted environment they fail-closed and are logged (no fake success). The signature/routing/
  logging/wiring paths are fully tested.
- Provider list currently: razorpay, stripe, twilio (SMS), whatsapp, email/SMTP, GSTN. New
  providers add a signature branch in `gateway.service.validateWebhookSignature`.
