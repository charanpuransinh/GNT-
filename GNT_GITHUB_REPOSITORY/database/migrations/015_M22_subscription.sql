-- ============================================================================
-- 015 — M22: subscription & billing tables (blueprint PRICING_SUBSCRIPTION_STRATEGY.md)
-- ============================================================================

CREATE TABLE IF NOT EXISTS m22_subscription_plans (
  id            text PRIMARY KEY,
  code          text NOT NULL UNIQUE,
  name          text NOT NULL,
  description   text,
  "priceMonthly" numeric(10,2) NOT NULL,
  "priceYearly"  numeric(10,2) NOT NULL,
  "billingCycle" text NOT NULL DEFAULT 'MONTHLY',
  features      jsonb NOT NULL DEFAULT '[]'::jsonb,
  "isActive"    boolean NOT NULL DEFAULT true,
  "createdAt"   timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt"   timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS m22_company_subscriptions (
  id          text PRIMARY KEY,
  company_id  text NOT NULL,
  "planId"    text NOT NULL REFERENCES m22_subscription_plans(id),
  status      text NOT NULL DEFAULT 'ACTIVE',
  "startDate" timestamp with time zone NOT NULL DEFAULT now(),
  "endDate"   timestamp with time zone,
  "autoRenew" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp with time zone NOT NULL DEFAULT now(),
  "updatedAt" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS m22_company_subscriptions_company_id_key
  ON m22_company_subscriptions (company_id);
CREATE INDEX IF NOT EXISTS m22_company_subscriptions_company_status_idx
  ON m22_company_subscriptions (company_id, status);
CREATE INDEX IF NOT EXISTS m22_company_subscriptions_plan_idx
  ON m22_company_subscriptions ("planId");
