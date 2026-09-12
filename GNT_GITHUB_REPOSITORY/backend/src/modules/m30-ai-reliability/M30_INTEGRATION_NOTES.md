# M30 — AI/ML Guards & Reliability — wiring status

Updated 2026-09-12.

## Dropped as duplicates — NOT copied into this module
- `integrations/integration-manager.service.ts` — M18-external-integration
  already owns integration connection lifecycle for real (`IntegrationRepository`,
  `integration_config`/`ApiKeyRegistry` tables, secret-ref storage).
- `integrations/payment-gateway.service.ts` — M18's `GatewayService.
  processPayment()` already handles payment gateway processing for real.
- `integrations/webhook-manager.service.ts` — M18 already owns webhook
  verification/routing/logging for real (`webhook.service.ts`, `WebhookLog`).

## What's wired
- `ai/ai-data-guard.ts` — pure logic, no external dependency, wired as-is.
- `reliability/retry.service.ts`, `reliability/timeout.service.ts` — pure
  logic, no external dependency, wired as-is.
- `reliability/idempotency.service.ts` — backed by a genuinely new
  `idempotency_record` table (migration 023). Verified this doesn't
  duplicate anything: M08/M22 already have their own ad hoc,
  unique-constraint-based idempotency handling, left untouched; this is a
  new, generic, opt-in mechanism.

## Verified, correctly left un-instantiated (no default singleton)
`ml-classifier.service.ts`, `fraud-detector.service.ts`,
`forecast.service.ts`, `integrations/bank-api.service.ts` all require an
injected external provider (AI/ML model, bank statement API). Verified:
no AI/ML SDK (openai/@anthropic-ai/tensorflow) and no bank-statement API
library/credentials exist anywhere in this repo (checked package.json;
also checked M11's real bank reconciliation code — it processes
already-fetched statement lines, never fetches from a live bank API).
Fabricating a provider would be guessing credentials/architecture that
doesn't exist — these classes are correct and ready for real injection
once such a provider is chosen.
