-- ============================================================================
-- 011 — M13: Smart Automation की 3 tables (blueprint §7.13)
--
-- blueprint (GNT_ADVANCED_SOFTWARE_BLUEPRINT_V2, §7.13 DATABASE Owner):
--     +-- automation_rule        [Trigger conditions + actions]
--     +-- scheduled_job          [Job definitions + schedules]
--     +-- job_execution_log      [Job run history]
--
-- column नाम camelCase हैं (Prisma model से मेल), quoted — वरना PostgreSQL
-- unquoted नाम lowercase कर देता है और Prisma का camelCase नाम टूट जाता है।
-- हर table tenant_id से बंधी है — fail-closed।
-- ============================================================================

DROP TABLE IF EXISTS m13_job_execution_logs;
DROP TABLE IF EXISTS m13_scheduled_jobs;
DROP TABLE IF EXISTS m13_automation_rules;

CREATE TABLE m13_automation_rules (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT,
  "triggerType"   TEXT NOT NULL,                    -- EVENT | SCHEDULE | MANUAL
  "triggerEvent"  TEXT,                             -- EVENT वाले rules के लिए event नाम
  "triggerConfig" JSONB,
  actions       JSONB NOT NULL,                     -- क्रम से: [{type, config}]
  "isActive"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT now(),
  "createdBy"     TEXT NOT NULL,
  "updatedBy"     TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS m13_rules_tenant_active_idx
  ON m13_automation_rules (tenant_id, "isActive");
CREATE INDEX IF NOT EXISTS m13_rules_tenant_trigger_idx
  ON m13_automation_rules (tenant_id, "triggerType");

CREATE TABLE m13_scheduled_jobs (
  id         TEXT PRIMARY KEY,
  tenant_id  TEXT NOT NULL,
  "ruleId"     TEXT NOT NULL REFERENCES m13_automation_rules (id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  "cronExpr"   TEXT NOT NULL,                        -- 5 fields: minute hour day month weekday
  timezone   TEXT NOT NULL DEFAULT 'UTC',
  payload    JSONB,
  status     TEXT NOT NULL DEFAULT 'ACTIVE',         -- ACTIVE | PAUSED
  "lastRunAt"  TIMESTAMP(3),
  "nextRunAt"  TIMESTAMP(3),
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT now(),
  "createdBy"  TEXT NOT NULL,
  "updatedBy"  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS m13_jobs_tenant_status_idx
  ON m13_scheduled_jobs (tenant_id, status);
CREATE INDEX IF NOT EXISTS m13_jobs_next_run_idx
  ON m13_scheduled_jobs ("nextRunAt");

CREATE TABLE m13_job_execution_logs (
  id          TEXT PRIMARY KEY,
  tenant_id   TEXT NOT NULL,
  "ruleId"      TEXT REFERENCES m13_automation_rules (id) ON DELETE SET NULL,
  "jobId"       TEXT REFERENCES m13_scheduled_jobs (id) ON DELETE CASCADE,
  status      TEXT NOT NULL,                         -- RUNNING | SUCCESS | FAILED
  message     TEXT,
  metadata    JSONB,
  "startedAt"   TIMESTAMP(3) NOT NULL DEFAULT now(),
  "finishedAt"  TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS m13_logs_tenant_started_idx
  ON m13_job_execution_logs (tenant_id, "startedAt");
CREATE INDEX IF NOT EXISTS m13_logs_tenant_job_idx
  ON m13_job_execution_logs (tenant_id, "jobId");
