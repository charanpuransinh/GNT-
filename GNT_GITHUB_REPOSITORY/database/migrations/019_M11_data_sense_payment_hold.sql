-- GNT — M11 Data Sense: bank-receipt import ki "on-hold" list (owner faisla 2026-09-09).
--
-- Jo receipt row apne-aap apply nahi hoti — customer naam se nahi mila / ek hi naam ke
-- kai / koi bakaya (approved/posted) bill nahi / owner ne doubtful|disputed mark kiya —
-- wo yahan OPEN status me parti hai. GNT yahan se kabhi apne-aap kuch apply/close nahi
-- karta; owner GET /api/v1/payments/data-sense/on-hold dekhkar jab chahe resolve karta hai.
--
-- Model ke columns camelCase hain (koi @map nahi) -> quoted identifiers.

CREATE TABLE IF NOT EXISTS "m11_data_sense_payment_holds" (
  "id"              TEXT PRIMARY KEY,
  "tenantId"        TEXT NOT NULL,
  "partyNameRaw"    TEXT NOT NULL,
  "resolvedPartyId" TEXT,
  "amount"          DECIMAL(18,4) NOT NULL,
  "valueDate"       TIMESTAMP(3) NOT NULL,
  "narration"       TEXT,
  "reason"          TEXT NOT NULL,
  "sourceSheet"     TEXT,
  "sourceRow"       INTEGER,
  "status"          TEXT NOT NULL DEFAULT 'OPEN',
  "resolutionNote"  TEXT,
  "resolvedTxnId"   TEXT,
  "createdBy"       TEXT NOT NULL,
  "resolvedBy"      TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"      TIMESTAMP(3)
);

CREATE INDEX IF NOT EXISTS "m11_data_sense_payment_holds_tenantId_status_idx"
  ON "m11_data_sense_payment_holds" ("tenantId", "status");

CREATE INDEX IF NOT EXISTS "m11_data_sense_payment_holds_tenantId_reason_idx"
  ON "m11_data_sense_payment_holds" ("tenantId", "reason");
