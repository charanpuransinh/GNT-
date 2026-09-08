-- GNT — M22: subscription invoice ko (subscription, period) par unique banao
-- Qodo #3: runBillingCycle findFirst-then-create bina lock ke -> concurrent cron/billing-run
-- dono check pass karke duplicate PENDING invoice bana dete the. DB-level unique isse rokta hai;
-- code P2002 ko "pehle se generated" maan leta hai.
--
-- Note: is model ke columns camelCase hain (koi @map nahi) -> quoted identifiers.
-- Agar pehle se duplicate (subscriptionId, periodStart) rows hain to index banane se pehle hataayein:
--   DELETE FROM m22_subscription_invoices a USING m22_subscription_invoices b
--   WHERE a.ctid < b.ctid AND a."subscriptionId" = b."subscriptionId" AND a."periodStart" = b."periodStart";

CREATE UNIQUE INDEX IF NOT EXISTS "m22_subscription_invoices_subscriptionId_periodStart_key"
  ON "m22_subscription_invoices" ("subscriptionId", "periodStart");

CREATE INDEX IF NOT EXISTS "m22_subscription_invoices_subscriptionId_status_idx"
  ON "m22_subscription_invoices" ("subscriptionId", "status");
