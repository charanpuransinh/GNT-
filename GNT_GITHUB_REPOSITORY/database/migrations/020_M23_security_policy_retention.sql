-- M23 Security & Governance — tenant-owned policy tables
-- Additive only. Does not touch any M01-M22 table.

CREATE TABLE IF NOT EXISTS security_policy (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  name        TEXT NOT NULL,
  resource    TEXT NOT NULL,
  action      TEXT NOT NULL,
  effect      TEXT NOT NULL,
  conditions  JSONB,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS security_policy_company_id_resource_action_idx
  ON security_policy (company_id, resource, action);

CREATE TABLE IF NOT EXISTS data_retention_policy (
  id              TEXT PRIMARY KEY,
  company_id      TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  retention_days  INTEGER NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at      TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS data_retention_policy_company_id_entity_type_key
  ON data_retention_policy (company_id, entity_type);
