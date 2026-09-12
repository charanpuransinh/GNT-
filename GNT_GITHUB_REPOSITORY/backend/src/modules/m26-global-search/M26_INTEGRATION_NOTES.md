# M26 — Global Search — wiring status

Updated 2026-09-12.

## Verified against real repo
- No Elasticsearch client dependency exists — real search is Postgres-backed
  (new `search_document` table, migration 021), case-insensitive substring
  match, not ranked full-text search. Documented limitation.
- The blueprint's fictional permission tiers (`M26.SEARCH.USE/ADVANCED/ADMIN/INDEX`)
  don't fit the real permission system's hard-coded 4-action rule
  (permission-catalog.ts: "the owner's four actions — no fifth outside
  these"). Resolved by: `M26:view` (search), `M26:edit` (rebuild index),
  `M26:delete` (remove from index); sensitive entity types (payroll/salary/
  employee_confidential) additionally require the OWNING module's real
  permission (`M12:view`), not a fabricated M26 tier.
- M26 added as a real catalog module/resource + mounted at `/api/v1/search`
  (module-registry.ts) — auth/tenant/permission middleware already runs
  globally on `/api/v1`, so this endpoint is enforced the same as every
  other module.
- Added one additive `ACTION_OVERRIDES` entry: `POST .../rebuild` -> `edit`
  (existing repo pattern, doesn't affect any other module's routes).

## Not implemented — gap in the shipped blueprint code, not invented here
The blueprint's own API contract lists `POST /api/v1/search/index/{entity}/sync`,
but `SearchController` (as shipped in the zip) has no method for it — only
`search`, `rebuildIndex`, `deleteFromIndex`. No route was added for it rather
than inventing a controller method that wasn't provided.

## Not done yet
No other module calls `SearchIndexService.indexEntity()` to populate the
index (e.g. on `party.created`, `sales.invoice.created`) — that event-driven
wiring is future work. `rebuildIndex()` therefore only re-touches documents
already indexed for a tenant; it does not derive new ones from other
modules' tables.
