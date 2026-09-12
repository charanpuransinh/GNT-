-- M27 Analytics, KPI & Dashboard — tenant-owned dashboard config table
-- Additive only. Does not touch any M01-M22 table.

CREATE TABLE IF NOT EXISTS analytics_dashboard (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  owner_id   TEXT NOT NULL,
  name       TEXT NOT NULL,
  widgets    JSONB NOT NULL,
  created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_dashboard_company_id_owner_id_idx
  ON analytics_dashboard (company_id, owner_id);
