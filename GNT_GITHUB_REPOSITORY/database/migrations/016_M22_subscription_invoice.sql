-- ============================================================================
-- 016 — M22: subscription invoice table (billing record)
-- ============================================================================

CREATE TABLE IF NOT EXISTS m22_subscription_invoices (
  id              text PRIMARY KEY,
  company_id      text NOT NULL,
  "subscriptionId" text NOT NULL REFERENCES m22_company_subscriptions(id) ON DELETE CASCADE,
  "planId"        text NOT NULL,
  amount          numeric(10,2) NOT NULL,
  "billingCycle"  text NOT NULL DEFAULT 'MONTHLY',
  status          text NOT NULL DEFAULT 'PENDING',
  "periodStart"   timestamp with time zone NOT NULL,
  "periodEnd"     timestamp with time zone NOT NULL,
  "createdAt"     timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS m22_subscription_invoices_company_status_idx
  ON m22_subscription_invoices (company_id, status);
