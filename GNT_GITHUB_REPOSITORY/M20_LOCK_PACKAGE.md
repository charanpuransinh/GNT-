# M20 — INTERNATIONAL TRADE — LOCK PACKAGE

## Module Info
- **Module ID:** M20
- **Name:** International Trade (export/import shipments, HSN/customs tariff, FX, landed cost, CBM/packing, trade documents, PEPPOL)
- **Mount:** `/api/v1/trade`
- **Status:** ✅ CERTIFIED by Claude 2026-09-08 — READY FOR OWNER LOCK
- **Certification evidence:** 52/52 M20 tests on live PostgreSQL (`TEST_DB=1`); typecheck clean; biome lint clean (38 files).

## P0 fixed at certification
**4 stray `new PrismaClient()`** — `controllers/hsn.controller.ts`, `controllers/trade.controller.ts`,
`controllers/customs.controller.ts`, `routes/trade.routes.ts` — each opened its own pool. Replaced
with the shared `@/common/config/prisma` singleton (same class as the M06/M08/M15/M19 P0s).

## Database Ownership
`trade_job`, `trade_document`, `customs_rule` — M20 OWNER (per-company).
`customs_tariff` — M20 OWNER, **national reference data** (8-digit tariff, chapter/heading/subheading,
BCD/SWS/IGST/cess) — shared across tenants by design (owner decision 2026-09-03: M20 owns the
international/customs HSN, M09 owns the domestic GST HSN, separate tables, neither touches the other).

## Public Surface (`/api/v1/trade`)
| Area | Endpoints |
|------|-----------|
| Shipments | POST `/exports` `/imports`, GET `/shipments` `/shipments/:id` |
| HSN / tariff | GET `/hsn/search` `/hsn/:code` `/hsn/chapters` `/hsn/chapters/:c/headings`, POST `/hsn/validate` |
| FX | GET `/fx/rates`, POST `/fx/convert` |
| Customs | POST `/customs/calculate` (BCD + SWS on assessable value), GET `/customs/rules` |
| Documents | POST `/documents/generate`, GET `/documents/:id`, GET `/shipments/:tradeJobId/documents` |
| Costing | POST `/cbm-calc` `/packing-list/optimize` (L×W×H×Qty ÷ 1,000,000 + container fit), POST `/landed-cost` |

## Calculators (pure, no DB — tested to the rupee)
| Service | What it computes |
|---------|------------------|
| `customs.service` | BCD = assessable × rate%; SWS = BCD × sws%; from `customs_rule` (per company, effective-dated) or `customs_tariff` |
| `m20-shipping-calculator` | inland + freight (air per-kg / ocean per-cbm / flat) + port CHA + marine insurance |
| `m20-container-cbm` | CBM per line, total CBM, container selection |
| `m20-currency-exchange` / `fx.service` | FX conversion from stored rates (per company) |
| `m20-country-tax-rules` | destination VAT / tariff / zero-rated-export / LUT — **rules injected, unknown country ⇒ zeros (never fabricated)** |
| `m20-peppol-generator` | UBL / PEPPOL structured invoice XML |

## Events
- Publishes: trade shipment lifecycle events (`trade.shipment.created`, …)
- Subscribes: none

## Security
- Every DB operation on `trade_job` / `customs_rule` / `trade_document` / FX rates is `company_id`-scoped
- `customs_tariff` lookups are intentionally global (national reference)
- Shared `@/common/config/prisma` singleton (P0 fixed)
- Calculator endpoints are stateless math behind route auth — no tenant data touched
- No cross-module writes

## Cross-Module Rules
- ✅ M20 owns `customs_tariff` (international HSN); M09 owns domestic GST HSN — **separate, neither overwrites the other** (owner decision, verified: M09 has zero `customs_tariff` refs, M20 zero `hsn_master` refs)
- ❌ M20 → any module's private repo/DB — FORBIDDEN

## 15-Artifact Lock Checklist
- [x] Module Contract (`routes/trade.routes.ts` + `trade.types.ts`)
- [x] Repository Map (trade repo + customs repo)
- [x] File Registry (controllers ×5, services ×11, model, validators, types, events)
- [x] Database Map (`trade_job`, `trade_document`, `customs_rule`, `customs_tariff`)
- [x] Database Registry (canonical `prisma/schema.prisma`)
- [x] Dependency Map (M01/M02 auth; own FX rates; national `customs_tariff`)
- [x] Wiring Map (`wiring-maps/module-wiring/m20/`)
- [x] Wiring Registry
- [x] API Contract (endpoint table above)
- [x] Integration Contract (customs calc contract; FX contract; PEPPOL/UBL document contract)
- [x] Security Contract — company-scoped trade data, global tariff reference, DI/singleton prisma
- [x] Test Report — 52/52 live-DB: peppol generator, shipping calculator, HSN service, trade document, container CBM, currency exchange, customs service, FX service, country tax rules, trade DB
- [x] Change Log — 2026-09-08: 4× prisma-singleton P0 fixed; cert pass
- [x] Version: 1.0.0
- [ ] Lock Status: **PENDING OWNER SIGN-OFF**

## Known scope boundaries (not defects)
- `customs_tariff` national rates are seed/reference data — the owner/ops load the current CBIC
  schedule; the module does not scrape it.
- `m20-country-tax-rules` expects its rules array to be provided (config/seed) — it never invents a
  country's VAT rate.
- The earlier "`breakdown` / `threeD` stub endpoints" were **deliberately dropped** (they returned
  empty) — not a gap; the packing/CBM calculator is real and tested.
