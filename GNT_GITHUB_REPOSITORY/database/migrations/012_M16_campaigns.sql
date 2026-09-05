-- ============================================================================
-- 012 — M16: Notification Campaign (SPEC-B WhatsApp campaign + order link)
-- ============================================================================

CREATE TABLE IF NOT EXISTS m16_campaigns (
  id             TEXT PRIMARY KEY,
  company_id     TEXT NOT NULL,
  name           TEXT NOT NULL,
  message        TEXT NOT NULL,
  channel        TEXT NOT NULL DEFAULT 'whatsapp',
  status         TEXT NOT NULL DEFAULT 'DRAFT',
  "targetPartyIds" JSONB,
  "orderOffer"     TEXT,
  "sentCount"      INTEGER NOT NULL DEFAULT 0,
  "failedCount"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT now(),
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT now(),
  "createdBy"      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS m16_campaigns_company_status_idx
  ON m16_campaigns (company_id, status);
