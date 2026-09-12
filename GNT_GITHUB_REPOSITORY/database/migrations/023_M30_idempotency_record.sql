-- M30 Reliability — generic idempotency store
-- Additive only. Does not touch any M01-M22 table or their existing
-- unique-constraint-based idempotency handling.

CREATE TABLE IF NOT EXISTS idempotency_record (
  id         TEXT PRIMARY KEY,
  company_id TEXT NOT NULL,
  key        TEXT NOT NULL,
  status     TEXT NOT NULL,
  result     JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT now(),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idempotency_record_company_id_key_key
  ON idempotency_record (company_id, key);
