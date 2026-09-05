-- ============================================================================
-- 014 — M12: leave number ko per-tenant unique karo
--
-- bug: `leaveNumber` global @unique tha — isliye do companies ka pehla leave
-- number (LEV-2026-0001) aapas me takrata tha (tenant-scoped sequence ke baad).
-- Ab leaveNumber har company ke andar hi unique hai (M11 paymentMethod.code jaisa).
-- ============================================================================

DROP INDEX IF EXISTS "m12_leaves_leaveNumber_key";
CREATE UNIQUE INDEX IF NOT EXISTS "m12_leaves_tenantId_leaveNumber_key"
  ON m12_leaves ("tenantId", "leaveNumber");
