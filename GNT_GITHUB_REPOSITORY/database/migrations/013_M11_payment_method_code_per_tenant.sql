-- ============================================================================
-- 013 — M11: payment method code ko per-tenant unique karo
--
-- bug: `code` global @unique tha — isliye poore system me har type (UPI/...)
-- ka sirf EK method ban sakta tha (sab companies ke liye shared). Ab code
-- har company ke andar hi unique hai.
-- ============================================================================

DROP INDEX IF EXISTS "m11_payment_methods_code_key";
DROP INDEX IF EXISTS "m11_payment_methods_code_tenant_id_idx";
CREATE UNIQUE INDEX IF NOT EXISTS "m11_payment_methods_code_tenantId_key"
  ON m11_payment_methods ("code", "tenant_id");
