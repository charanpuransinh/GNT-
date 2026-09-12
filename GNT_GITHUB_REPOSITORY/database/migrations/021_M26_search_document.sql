-- M26 Global Search — tenant-owned search index table
-- Additive only. Does not touch any M01-M22 table.

CREATE TABLE IF NOT EXISTS search_document (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  fields      JSONB NOT NULL,
  created_at  TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS search_document_company_id_entity_type_entity_id_key
  ON search_document (company_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS search_document_company_id_entity_type_idx
  ON search_document (company_id, entity_type);
