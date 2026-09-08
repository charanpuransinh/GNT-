// M12 — TDS section (vendor / non-salary payment) config types
// Source of truth: config/tds_slabs.json  (env override: TDS_SLABS_CONFIG_PATH)

export type DeducteeType = 'individual' | 'huf' | 'company' | 'firm' | 'other';

/** A single section entry as it appears in tds_slabs.json.
 *  Either a split rate (rate_ind + rate_other) OR a flat `rate` must be present. */
export interface TdsSectionConfig {
  label?: string;
  /** rate applied to deductee_type individual | huf */
  rate_ind?: number;
  /** rate applied to every other deductee type */
  rate_other?: number;
  /** flat rate applied to everyone (used when rate_ind/rate_other absent) */
  rate?: number;
  /** per-payment amount at or below this => zero TDS */
  threshold: number;
}

export interface TdsConfigMeta {
  description?: string;
  fy?: string;
  last_updated?: string;
  updated_by?: string;
  [k: string]: unknown;
}

export interface TdsConfigFile {
  meta?: TdsConfigMeta;
  sections: Record<string, TdsSectionConfig>;
}

/** Where a resolved section came from — for transparency in API responses. */
export type TdsConfigSource = 'file' | 'fallback';

export interface ResolvedTdsSection extends TdsSectionConfig {
  section: string;
  source: TdsConfigSource;
}

export interface TdsCalculationInput {
  section: string;
  amount: number;
  deducteeType?: DeducteeType;
}

export interface TdsCalculationResult {
  section: string;
  label?: string;
  amount: number;
  deducteeType: DeducteeType;
  applicableRate: number;
  threshold: number;
  belowThreshold: boolean;
  tdsAmount: number;
  netPayable: number;
  source: TdsConfigSource;
}
