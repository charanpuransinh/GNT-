// M12 — TDS Section Service (vendor / non-salary payments: 194C, 194J, 194I, ...)
//
// DESIGN (owner-directed, 2026-09-07):
//   * NO rates or thresholds are hardcoded in business logic. Every number is read
//     from an external JSON file: config/tds_slabs.json (override: TDS_SLABS_CONFIG_PATH).
//   * On any Budget / CBDT change the owner/accountant edits that file and saves —
//     the change is picked up on the next request (mtime-checked), no redeploy.
//   * FALLBACK_DEFAULTS below exist ONLY so the service still answers if the config
//     file is missing or unreadable. They are NOT the source of truth and every API
//     response says `source: "fallback"` when they are in use, so a missing file is
//     visible rather than silent. This fallback is an explicit owner-authorised
//     exception to the "no placeholder constants" rule — see CERTIFICATION_LOG.md
//     2026-09-07 and the M12 TDS PR.
//
// Salary TDS (section 192) is deliberately NOT handled here — that is slab-based and
// lives in the DB via tax-slab.service.ts + the /api/v1/hr/tax-slabs admin screen.

import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type {
  DeducteeType,
  ResolvedTdsSection,
  TdsCalculationInput,
  TdsCalculationResult,
  TdsConfigFile,
  TdsSectionConfig,
} from '../types/tds-section.types';

/** Owner-provided current rates. Fallback only — config/tds_slabs.json overrides all of this. */
const FALLBACK_DEFAULTS: TdsConfigFile = {
  meta: { description: 'in-code fallback — config/tds_slabs.json not found', updated_by: 'fallback' },
  sections: {
    '194C': { label: 'Payment to contractors / sub-contractors', rate_ind: 0.01, rate_other: 0.02, threshold: 30000 },
    '194J': { label: 'Fees for professional or technical services', rate: 0.1, threshold: 50000 },
    '194I': { label: 'Rent of plant, machinery or equipment', rate: 0.02, threshold: 240000 },
  },
};

const INDIVIDUAL_LIKE: ReadonlySet<DeducteeType> = new Set<DeducteeType>(['individual', 'huf']);

function defaultConfigPath(): string {
  // src/modules/m12-hr/services/ -> up 4 -> backend/ ; then config/tds_slabs.json
  return fileURLToPath(new URL('../../../../config/tds_slabs.json', import.meta.url));
}

export class TdsSectionService {
  private readonly configPath: string;
  private cache: { mtimeMs: number; data: TdsConfigFile } | null = null;
  private usingFallback = true;

  constructor(configPath?: string) {
    this.configPath = configPath ?? process.env.TDS_SLABS_CONFIG_PATH ?? defaultConfigPath();
  }

  /** Load config, re-reading only when the file's mtime changed. Falls back on any error. */
  private load(): TdsConfigFile {
    let mtimeMs: number;
    try {
      mtimeMs = statSync(this.configPath).mtimeMs;
    } catch {
      this.usingFallback = true;
      this.cache = null;
      return FALLBACK_DEFAULTS;
    }

    if (this.cache && this.cache.mtimeMs === mtimeMs) return this.cache.data;

    try {
      const raw = readFileSync(this.configPath, 'utf8');
      const parsed = JSON.parse(raw) as TdsConfigFile;
      if (!parsed || typeof parsed !== 'object' || !parsed.sections || typeof parsed.sections !== 'object') {
        throw new Error('tds_slabs.json: missing "sections" object');
      }
      this.cache = { mtimeMs, data: parsed };
      this.usingFallback = false;
      return parsed;
    } catch (err) {
      // Malformed file — do not crash payroll/payment flows; fall back and stay loud.
      console.error(`[M12/TDS] config load failed (${this.configPath}): ${(err as Error).message}. Using fallback defaults.`);
      this.usingFallback = true;
      this.cache = null;
      return FALLBACK_DEFAULTS;
    }
  }

  private sourceOf(fromFile: boolean): 'file' | 'fallback' {
    return fromFile && !this.usingFallback ? 'file' : 'fallback';
  }

  /** Raw config (meta + sections) plus which source is live. */
  getConfig(): { meta: TdsConfigFile['meta']; sections: Record<string, TdsSectionConfig>; source: 'file' | 'fallback'; path: string } {
    const cfg = this.load();
    return { meta: cfg.meta, sections: cfg.sections, source: this.sourceOf(true), path: this.configPath };
  }

  listSections(): ResolvedTdsSection[] {
    const cfg = this.load();
    const fileSource = this.sourceOf(true);
    return Object.entries(cfg.sections).map(([section, s]) => ({ section, source: fileSource, ...s }));
  }

  /** Resolve one section; if the file has no such section, try the fallback for it. */
  getSection(section: string): ResolvedTdsSection {
    const code = section.trim().toUpperCase();
    const cfg = this.load();
    const fromFile = cfg.sections[code];
    if (fromFile) return { section: code, source: this.sourceOf(true), ...fromFile };

    const fromFallback = FALLBACK_DEFAULTS.sections[code];
    if (fromFallback) return { section: code, source: 'fallback', ...fromFallback };

    throw new Error(`Unknown TDS section "${code}". Add it to ${this.configPath} under "sections".`);
  }

  /** Rate for a section given the deductee type. */
  private rateFor(s: TdsSectionConfig, deducteeType: DeducteeType): number {
    if (s.rate_ind != null || s.rate_other != null) {
      const r = INDIVIDUAL_LIKE.has(deducteeType) ? s.rate_ind : s.rate_other;
      if (r == null) throw new Error('Section has rate_ind/rate_other but the one needed is missing');
      return r;
    }
    if (s.rate != null) return s.rate;
    throw new Error('Section config has neither rate_ind/rate_other nor rate');
  }

  /**
   * TDS on a single vendor payment.
   * Rule: amount at or below the section threshold => 0; above => rate * full amount.
   */
  calculate(input: TdsCalculationInput): TdsCalculationResult {
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0) throw new Error('amount must be a non-negative number');
    const deducteeType: DeducteeType = input.deducteeType ?? 'other';

    const resolved = this.getSection(input.section);
    const rate = this.rateFor(resolved, deducteeType);
    const threshold = Number(resolved.threshold ?? 0);
    const belowThreshold = amount <= threshold;
    const tdsAmount = belowThreshold ? 0 : Math.round(amount * rate * 100) / 100;

    return {
      section: resolved.section,
      label: resolved.label,
      amount,
      deducteeType,
      applicableRate: rate,
      threshold,
      belowThreshold,
      tdsAmount,
      netPayable: Math.round((amount - tdsAmount) * 100) / 100,
      source: resolved.source,
    };
  }

  /** True when answers are coming from config/tds_slabs.json, false when from the in-code fallback. */
  isUsingConfigFile(): boolean {
    this.load();
    return !this.usingFallback;
  }
}

export const tdsSectionService = new TdsSectionService();
