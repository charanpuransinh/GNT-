-- M31 Workforce Intelligence — tenant-owned tables
-- Additive only. Does not touch any M01-M22 table (including m12_employees).

CREATE TABLE IF NOT EXISTS talent_profile (
  id          TEXT PRIMARY KEY,
  company_id  TEXT NOT NULL,
  employee_id TEXT NOT NULL,
  skills      JSONB NOT NULL,
  summary     TEXT,
  updated_at  TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS talent_profile_company_id_employee_id_key
  ON talent_profile (company_id, employee_id);

CREATE TABLE IF NOT EXISTS candidate_feedback (
  id             TEXT PRIMARY KEY,
  company_id     TEXT NOT NULL,
  candidate_id   TEXT NOT NULL,
  requirement_id TEXT NOT NULL,
  manager_id     TEXT NOT NULL,
  decision       TEXT NOT NULL,
  reason         TEXT,
  recorded_at    TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS candidate_feedback_company_id_requirement_id_idx
  ON candidate_feedback (company_id, requirement_id);
