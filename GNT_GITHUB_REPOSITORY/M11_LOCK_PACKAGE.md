# M11 — PAYMENT — LOCK PACKAGE

## Module Info
- **Module ID:** M11
- **Name:** Payment (transactions, methods, bank accounts, refunds, reconciliation, M10 ledger bridge, **Data Sense** legacy-import pipeline)
- **Mount:** `/api/v1/payments` (Data Sense sub-router at `/api/v1/payments/data-sense`)
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 17/17 M11 tests + 30/30 relocated Data Sense tests (28 existing + 2 new FIFO-settlement) on live PostgreSQL (`TEST_DB=1`); full backend suite green; typecheck clean; biome lint clean.

## Data Sense sub-module (was standalone M21 — folded in 2026-09-08 by owner decision)
`src/modules/m11-payment/data-sense/` — reads a client's legacy file (Tally/Vyapar/Marg/Excel/CSV),
SENSE → MAP → VALIDATE → PREVIEW → (on approval) TRANSFER into the owning module via its **public API**
(party→M05, item→M06, purchase→M07, sales→M08, accounting→M10, export→M20). It owns no master data.
- **Routes (`/api/v1/payments/data-sense`):** `POST /analyze`, `POST /transfer`, `GET /field-map`,
  `GET /options`, **`GET /on-hold`**, **`POST /on-hold/:id/resolve`** — all under M11's `payment` permission.

### Never auto-close (owner decision 2026-09-09)
GNT never auto-closes / auto-writes-off a receivable. Data Sense only ever sets an invoice to
`paid`/`partial` **by the exact `amountPaid` a real matched receipt adds** — it has no code path that
bulk-closes, cancels, or discounts an invoice. An opening-balance / migrated due with no matching
receipt stays `unpaid` (Open) forever until the owner acts. (Batch write-off review — the twice-monthly
AR popup — is a separate next-sprint module.)

### Owner decision #3 (bank receipts)
- **`fifo-invoice-settlement` → M11** — industry-standard "Apply to Oldest". A **clean** receipt
  (customer found by exact name, has an open approved/posted bill) is settled **silently, FIFO**:
  - one `$transaction`; each invoice update is a conditional `updateMany` that must hit exactly 1 row
  - the **full** receipt is the `PaymentTransaction.amount`; remainder → an `ACCOUNT` allocation
  - idempotency key `providerRef = 'DS-' + sha256(company|party|amount|date|narration)`
  - `BANK_TRANSFER` method resolved by code (created if absent, P2002-safe)
  - balanced M11 audit-ledger pair (Dr `CASH_BANK` / Cr `ACCOUNTS_RECEIVABLE`) via `LedgerRepository`
  - **no fresh M10 voucher** — a historical bulk import would double-count against migrated opening
    balances (owner-confirmed boundary; M08 balances + M11 audit ledger are updated)
- **On-hold list** (`DataSensePaymentHold`, migration `019`) — a receipt is **parked, never auto-applied**, when:
  - `CUSTOMER_NOT_FOUND` — no customer matches the name  · `AMBIGUOUS_PARTY` — >1 match
  - `NO_OPEN_INVOICE` — customer found but no open approved/posted bill
  - `DOUBTFUL` / `DISPUTED` — the `flag` column (`doubtful`/`disputed`/`hold`) says so
  The owner reviews `GET /on-hold` (aging-bucketed: `<1m`/`1-2m`/`2-3m`/`3-6m`/`>6m`) and per row
  `POST /on-hold/:id/resolve` → `apply-fifo` (optionally with `customerId`) or `discard`. No action ⇒
  the row stays `OPEN`. This list is **not** shown in any recurring popup — owner-initiated only.
- **`direct-ledger-credit` (default) → `pending-adapter`** — a single-sided M10 credit needs the owner's
  bank/receivable account mapping; use Option B or a manual entry until then.
- **Dates:** shared strict parser (`date.util.ts`) — day-first `dd/mm/yyyy` + ISO, real-calendar
  validation (`31/02/2026` rejected); used by `validate.engine` and every executor adapter.
- **Tests:** `data-sense/tests/unit/*` — 28 relocated + `bank.fifo.db.test.ts` (10: silent FIFO
  full/partial, advance, no-open-bill → on-hold, unknown payer → on-hold, ambiguous name → on-hold,
  `disputed` flag → on-hold, day-first + invalid date, idempotent re-import, on-hold list + aging +
  owner `apply-fifo`/`discard`, opening-balance stays Open).

## Database Ownership
`PaymentTransaction`, `PaymentMethod`, `PaymentAllocation`, `PaymentSchedule`, `PaymentInstallment`,
`Refund`, `PaymentLedgerEntry`, `PaymentReconciliation`, `PaymentReconciliationItem`, `BankAccount`,
`DataSensePaymentHold` — M11 OWNER.
Migrations: `001_M11_payment_master.sql`, `013_M11_payment_method_code_per_tenant.sql`,
`019_M11_data_sense_payment_hold.sql`.

## Public Surface (`/api/v1/payments`)
| Area | Endpoints |
|------|-----------|
| Transactions | POST `/transactions`, GET `/transactions`, GET `/transactions/:id`, POST `/transactions/:id/process` |
| Methods | POST/GET/PUT/DELETE `/methods` |
| Bank accounts | POST/GET/PUT/DELETE `/bank-accounts` |
| Refunds | POST `/refunds`, POST `/refunds/:id/approve`, GET `/refunds` |
| Reconciliation | POST `/reconciliations`, GET `/reconciliations/:id`, POST `/reconciliations/:id/upload-statement` (auto-match) |
| Data Sense | POST `/data-sense/analyze`, POST `/data-sense/transfer`, GET `/data-sense/field-map`, GET `/data-sense/options`, GET `/data-sense/on-hold`, POST `/data-sense/on-hold/:id/resolve` |

## M10 ledger integration (`services/ledgerBridge.service.ts`) — the real fix
Before: `payment.service` wrote to its own private `PaymentLedgerEntry` with hardcoded account codes
(`CASH_BANK`, `SALES_REVENUE`); a comment said "M10 Finance integration" but M10's real
`ledger`/`account_master` (which trial balance / P&L / balance sheet read) were never touched — so
payments never appeared in the actual books.
Now: `LedgerBridgeService` calls M10's public `VoucherService.createPaymentVoucher` (owner's voucher
design, already in M10). Deterministic lookup-or-create of the M10 `account_master` control accounts
from the M11 bank account + normalized party type — **no new chart-of-accounts decision**, standard
control-account pattern.
- CUSTOMER receipt ⇒ direction `IN`, invoice marked paid, bank balance up
- VENDOR / EMPLOYEE / SYSTEM ⇒ direction `OUT`, bank balance down
(both directions tested against real M10 vouchers)

## M05 integration
Party existence validated via `partyService` before a payment is created — payment on a
non-existent party is rejected (tested).

## Events
- Publishes: `payment.created`, `payment.completed`, `payment.failed`, `refund.requested`,
  `refund.completed`, `refund.rejected`, `bank_account.created`, `payment_method.created`,
  `reconciliation.created`, `invoice.payment_received`
- Subscribes: `subscribeAll` (for M18 payment-confirm wiring)

## Security
- Auth: token-only (`401` without token, `401` on bad token — tested)
- Every query tenant-scoped; cross-tenant read + write blocked (tested)
- Services receive `PrismaClient` by dependency injection — no stray `new PrismaClient()`
- `created_by` / audit identity from verified context, not request body
- Decimal money via `@prisma/client/runtime/library` `Decimal` + `utils/decimal.helper.ts` (no float drift)

## Cross-Module Rules
- ✅ M11 → M10 `VoucherService` (PUBLIC) — ALLOWED
- ✅ M11 → M05 `partyService` (PUBLIC) — ALLOWED
- ❌ M11 → M10 `chart_of_accounts` table directly — FORBIDDEN (uses lookup-or-create via public service)
- ❌ M11 → any private repo/DB across modules — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/index.ts` + schema)
- [x] Repository Map (6 repositories: payment, paymentMethod, bankAccount, refund, reconciliation, ledger)
- [x] File Registry (controllers ×5, services ×6, repositories ×6, routes ×6, middleware ×2, utils ×2, validators, types)
- [x] Database Map (11 models above, incl. `DataSensePaymentHold`)
- [x] Database Registry (migrations `001`, `013`; canonical `prisma/schema.prisma`)
- [x] Dependency Map (M10 VoucherService, M05 partyService, shared eventBus, M01/M02 auth)
- [x] Wiring Map (`wiring-maps/module-wiring/m11/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (M10 voucher bridge contract; M05 party validation; event payloads)
- [x] Security Contract — token-only identity, tenant-scoped, DI prisma, Decimal money, audit identity server-side
- [x] Test Report — 17/17 M11 live-DB (33/33 combined with M16) + 38/38 Data Sense live-DB (10 in `bank.fifo.db.test.ts` covering silent-FIFO, on-hold for every reason, aging list, owner resolve, never-auto-close); auth gates, per-entity CRUD, M05 validation, M10 double-entry voucher (both directions), tenant isolation read+write
- [x] Change Log — 2026-09-08: full cert pass. **2026-09-08 #2:** absorbed the former standalone M21 as the `data-sense/` sub-module (owner decision); implemented owner decision #3 — bank-receipt `settle-invoices-fifo` executor branch; removed M21's `module-registry` + `permission-catalog` entries. **2026-09-09 (Qodo review — 12 findings):** hardened `settleInvoicesFifo` — exact customer lookup (no auto-create, no wrong-party), approved/posted invoices only (not draft), full receipt captured with advance allocation, single-`$transaction` conditional invoice updates, `sha256` idempotency key, `BANK_TRANSFER`-by-code method, balanced M11 audit-ledger pair, collision-safe txn number; `credit-ledger` reverted to `pending-adapter` (needs owner account mapping); shared strict day-first date parser (`date.util.ts`); fixed stale `m21-data-sense` refs in `tests/m20-m21.deterministic.test.ts` + `backend/package.json`. **2026-09-09 (owner spec — #8):** never-auto-close guarantee; `settleReceiptRow` splits into silent-FIFO (clean) vs **on-hold** (`DataSensePaymentHold`, migration `019`) for `CUSTOMER_NOT_FOUND`/`AMBIGUOUS_PARTY`/`NO_OPEN_INVOICE`/`DOUBTFUL`/`DISPUTED`; `GET /on-hold` (aging) + `POST /on-hold/:id/resolve` (`apply-fifo`|`discard`); FIFO core extracted to `receiptSettlement.ts` (shared by import + hold-resolve). Earlier (Claude): real M10 ledger bridge, M05 party validation, direction-from-party-type fix
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- Payment gateway integration (Razorpay etc.) is out of scope here — M18 External Integration owns
  gateway webhooks; M11 exposes `payment.completed` / confirm hooks for it.
- Reconciliation auto-match is deterministic (UTR / amount / date) — narration-only matching is not used.
