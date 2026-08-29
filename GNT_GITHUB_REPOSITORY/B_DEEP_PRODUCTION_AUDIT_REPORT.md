# B --- Deep Production Audit Report

## Scope

**Archive audited:** `GNT Tim B.zip`\
**Functional scope:** M06 Inventory, M07 Purchase, M08 Sales/Billing,
M09 GST, M10 Accounting.

## Executive verdict

**Production readiness: \~82% --- STRONGEST OF A/B/C, BUT NOT YET
PRODUCTION-FINAL.**

B has a strong module layout, database artifacts, wiring maps,
cross-module flows and a larger test footprint. The largest blockers are
**M07 OCR being a mock implementation**, packaging duplication, and the
lack of a single obvious deployable root build manifest.

### Severity summary

  Severity        Finding
  ------------- ---------
  🔴 Critical           0
  🔴 High               2
  🟠 Medium             5
  🟡 Low                4

------------------------------------------------------------------------

## 🔴 HIGH

### B-FUNC-001 --- M07 OCR is still a mock implementation

**File:** `backend/src/modules/m07-purchase/services/ocr.service.ts`

**Problem:** `processImage()` ignores the uploaded image and calls
`mockOCRText()`.

**Impact:** Production invoice OCR does not actually read uploaded
documents.

**Required fix:** - Integrate the approved OCR provider/engine. -
Validate file type, MIME type, size and image/PDF safety. - Process the
actual uploaded bytes. - Persist the OCR job/result. - Keep mandatory
human review before posting, as the current business rule intends. - Add
failure/retry/idempotency handling.

**Acceptance test:** A real invoice image produces a persisted OCR
result from the actual document, with no hard-coded invoice content.

------------------------------------------------------------------------

### B-FUNC-002 --- M07 OCR parser is explicitly a simplified/mock parser

**File:**
`backend/src/modules/m07-purchase/services/purchase.internal.ts`

**Problem:** `parseOCRText()` is documented as a mock parser and relies
on simple regex extraction.

**Impact:** Real-world invoice formats, supplier variations, GST fields,
multi-line items and OCR noise can produce incorrect accounting data.

**Required fix:** Replace or supplement with a production document/OCR
parsing pipeline, supplier-specific rules where necessary, confidence
thresholds, validation and human review.

------------------------------------------------------------------------

## 🟠 MEDIUM

### B-PKG-001 --- Duplicate identical B4 package

The following two archives have the same SHA-256:

-   `GNT_SESSION5_B4_BRAVO_COMPLETE.zip`
-   `GNT_SESSION5_M10_B4_BRAVO_COMPLETE.zip`

**Impact:** Release ambiguity and unnecessary duplication.

**Fix:** Retain one canonical package and mark the other as superseded.

------------------------------------------------------------------------

### B-PKG-002 --- B has multiple package layers instead of one canonical release

The archive includes separate M06, M07, M08, M09/M10 and
combined/session packages.

**Fix:** Produce one canonical source tree: `frontend/`, `backend/`,
`prisma/`, `api-contracts/`, `wiring-maps/`, `tests/`, root build
configuration.

------------------------------------------------------------------------

### B-BUILD-001 --- No clear root package.json in the final B package

The audited B root has Prisma and source trees but no obvious root
`package.json` at the extracted release root.

**Impact:** A fresh CI agent cannot be assumed to know how to
install/build/test the complete B release.

**Fix:** Add root package management/workspaces or a documented build
orchestrator with deterministic scripts.

------------------------------------------------------------------------

### B-DB-001 --- Multiple Prisma schema files need a canonical generation/migration contract

Present: - `prisma/schema.prisma` -
`prisma/m07-purchase.schema.prisma` - `prisma/m08-sales.prisma`

**Risk:** Schema ownership and migration ordering can diverge.

**Fix:** Define one authoritative schema/migration strategy and document
module ownership.

------------------------------------------------------------------------

### B-INT-001 --- Cross-module flows need live integration verification

Wiring maps exist for: - GST filing - payment allocation - purchase
invoice - salary processing - sales invoice - stock adjustment

This is good architecture, but the audit does not certify that every
flow has been executed against real persistence and real module
boundaries.

**Fix:** Add end-to-end tests that execute each flow against a clean
database.

------------------------------------------------------------------------

## 🟡 LOW

### B-TEST-001 --- Many unit tests are mock-heavy

The test suite is substantial, but a significant number of unit tests
mock repositories/services.

**Risk:** Tests can pass while actual Prisma/database wiring is broken.

**Fix:** Increase real integration coverage around transactional
boundaries.

### B-TEST-002 --- Security tests should be part of the release gate

Verify tenant isolation, unauthorized access, role restrictions,
replay/idempotency and input validation for every module.

### B-OPS-001 --- Production OCR/storage/provider configuration needs secret-management documentation

Document provider credentials, bucket configuration, retention and
failure handling.

### B-OPS-002 --- Accounting/GST production reconciliation should have a controlled verification procedure

Before go-live, run representative purchase, sales, GST and ledger
scenarios and reconcile expected totals.

------------------------------------------------------------------------

## What is already good

-   M06--M10 are represented.
-   Backend controllers/services/repositories/validators are present.
-   `prisma/schema.prisma` and module-specific schema artifacts exist.
-   Module wiring maps for M06--M10 exist.
-   Cross-module flow wiring maps exist.
-   Event registry exists.
-   Tests are present across modules.
-   M07 has an explicit human-review safeguard for OCR output.
-   No M04/M05 gap is relevant to B.

## Production gate for B

**BLOCKED primarily by B-FUNC-001/B-FUNC-002 and release packaging.**

Once real OCR is integrated, canonical packaging is established, and
clean CI/E2E tests pass, B can be considered close to production
readiness.

------------------------------------------------------------------------

# Combined recommendation

### Priority order

1.  **A:** Fix M02 authentication completely.
2.  **B:** Replace M07 mock OCR with the actual production OCR pipeline.
3.  Consolidate duplicate/overlapping A and B packages into canonical
    release trees.
4.  Run clean CI from scratch.
5.  Run real DB migration tests.
6.  Run A→B integration flows.
7.  Perform security and tenant-isolation testing.
8.  Only then issue a production release candidate.

**Important:** These reports distinguish *code present* from *production
behavior proven*. A source file or test file existing in the ZIP is not
treated as proof that the production behavior works.
