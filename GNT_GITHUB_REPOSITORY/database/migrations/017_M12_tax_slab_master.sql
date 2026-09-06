-- ============================================================================
-- 017 — M12: income tax / TDS slabs (effective-dated, admin-editable)
-- column names = @map (snake_case)
-- ============================================================================

CREATE TABLE IF NOT EXISTS m12_tax_slab_master (
  id                text PRIMARY KEY,
  financial_year    text NOT NULL,
  regime            text NOT NULL DEFAULT 'NEW',
  income_from       numeric(15,2) NOT NULL,
  income_to         numeric(15,2),
  tax_rate_percent  numeric(5,2) NOT NULL,
  cess_percent      numeric(5,2) NOT NULL DEFAULT 0,
  effective_from    date NOT NULL DEFAULT now(),
  effective_to      date,
  is_active         boolean NOT NULL DEFAULT true,
  created_by        text,
  created_at        timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS m12_tax_slab_master_year_regime_active_idx
  ON m12_tax_slab_master (financial_year, regime, is_active);
