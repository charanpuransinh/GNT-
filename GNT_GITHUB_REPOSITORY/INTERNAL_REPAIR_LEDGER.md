# GNT Full Rebuild — Internal Repair Ledger
Date: 2026-08-29

This ledger records repairs discovered during the M01–M20 consolidation and is
intended for engineering traceability.

- Integrated Team-D M16–M20 into the canonical source tree.
- Repaired M18 JSX route extension (`.ts` → `.tsx`).
- Repaired M11/M15 frontend TypeScript project references.
- Repaired M14/M15 backend local tsconfig scope.
- Added canonical shared error/event compatibility exports for M20/M17 contract paths.
- Added M14 constants compatibility export.
- Corrected M11 payment route validation import paths.
- Corrected M13 worker/queue local import paths.
- Removed fake M16 channel gateway implementations; delivery now fails closed until M18 is composed/configured.
- Replaced M14 mock XML parsing with fast-xml-parser implementation.
- Replaced M14 mock PDF output with PDFKit generation.
- Added tenant scoping to M14 import/export updates.
- Replaced M20 hard-coded 18% IGST with active HSN master IGST rate.
- Hardened root TypeScript configuration for mixed frontend/backend compilation.
- Promoted M19 Team-D backend/frontend into canonical M19 module locations.
- Added package manifests for backend/frontend and declared detected runtime/test dependencies.
- Added production-source and configuration validation records.

Known environment gate: dependency installation and live PostgreSQL/E2E/external-provider
execution could not be completed in this isolated runtime. No fabricated PASS was recorded.
