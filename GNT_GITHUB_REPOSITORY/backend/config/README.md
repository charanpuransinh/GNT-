# `backend/config/`

Runtime configuration files that the owner / accountant edits **without a code change or redeploy**.

## `tds_slabs.json` — vendor / non-salary TDS rates (194C, 194J, 194I, …)

Source of truth for TDS deducted when the business **pays a vendor** (contractors, professionals,
rent, …). Consumed by `src/modules/m12-hr/services/tds-section.service.ts`.

- **To change a rate or threshold** (e.g. after a Union Budget / CBDT notification): edit the number
  in `sections`, save. The running server picks it up on the next request — it re-reads the file
  whenever its modification time changes. No restart, no deploy.
- **To add a new section** (194Q, 194T, …): add another key under `sections` with `threshold` and
  either a flat `rate` or a `rate_ind` / `rate_other` pair.
- **Override the file location** with the `TDS_SLABS_CONFIG_PATH` env var (e.g. to point at a file on
  a mounted volume that ops manages).

### Field meaning

| field | meaning |
|-------|---------|
| `rate` | flat decimal rate for everyone (e.g. `0.1` = 10%) |
| `rate_ind` / `rate_other` | split rate — `rate_ind` for deductee type `individual` / `huf`, `rate_other` for the rest (used by 194C) |
| `threshold` | per-payment amount **at or below** which no TDS is deducted; above it, TDS applies to the full amount |
| `label` | human description, shown in the API response |

### Fallback

If this file is missing or unparseable the service falls back to a small set of in-code current
rates so payments don't break, and **every API response is marked `"source": "fallback"`** so the
missing file is visible. The file — not the fallback — is authoritative; keep it present in every
environment. (The in-code fallback is an explicit owner-authorised exception to the project's
"no placeholder constants" rule — see `CERTIFICATION_LOG.md`, 2026-09-07.)

### Not here: salary TDS (section 192)

Employee salary TDS is slab-based and lives in the database (`TaxSlabMaster`), editable through the
`GET/POST /api/v1/hr/tax-slabs` admin endpoints — not in this file.

## API

| method | path | purpose |
|--------|------|---------|
| `GET`  | `/api/v1/hr/tds-sections` | current section config + which source (`file` / `fallback`) is live |
| `POST` | `/api/v1/hr/tds-sections/calculate` | body `{ section, amount, deducteeType? }` → `{ applicableRate, threshold, belowThreshold, tdsAmount, netPayable, source }` |
