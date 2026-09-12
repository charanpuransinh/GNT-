/**
 * M23 — privacy/data-masking.service.ts
 * OWN: Mask sensitive fields in an outbound record according to what the
 * caller is NOT authorized to see (as determined by sensitive-data.guard.ts).
 */

export type MaskStrategy = 'full' | 'partial' | 'redact';

export interface MaskingRule {
  field: string;
  strategy: MaskStrategy;
}

const DEFAULT_STRATEGY: MaskStrategy = 'redact';

export class DataMaskingService {
  /**
   * Returns a shallow copy of `record` with unauthorized fields masked.
   * Never mutates the input object.
   */
  mask<T extends Record<string, unknown>>(
    record: T,
    unauthorizedFields: string[],
    rules: MaskingRule[] = [],
  ): T {
    if (unauthorizedFields.length === 0) return record;

    const ruleMap = new Map(rules.map((r) => [r.field, r.strategy]));
    const masked: Record<string, unknown> = { ...record };

    for (const field of unauthorizedFields) {
      if (!(field in masked)) continue;
      const strategy = ruleMap.get(field) ?? DEFAULT_STRATEGY;
      masked[field] = this.applyStrategy(masked[field], strategy);
    }

    return masked as T;
  }

  maskMany<T extends Record<string, unknown>>(
    records: T[],
    unauthorizedFields: string[],
    rules: MaskingRule[] = [],
  ): T[] {
    return records.map((r) => this.mask(r, unauthorizedFields, rules));
  }

  private applyStrategy(value: unknown, strategy: MaskStrategy): unknown {
    switch (strategy) {
      case 'redact':
        return null;
      case 'full':
        return typeof value === 'string' ? '*'.repeat(value.length) : '****';
      case 'partial': {
        if (typeof value !== 'string' || value.length <= 4) return '****';
        const visible = value.slice(-4);
        return `${'*'.repeat(value.length - 4)}${visible}`;
      }
      default:
        return null;
    }
  }
}

export const dataMaskingService = new DataMaskingService();
