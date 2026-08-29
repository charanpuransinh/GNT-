/**
 * M17 Reporting — Report Cache
 * Simple in-process cache for generated report payloads, keyed by
 * companyId + reportType. Swap the Map-based store for Redis in
 * production by replacing the three methods below — callers
 * (report.handlers.ts, report.service.ts) don't need to change.
 */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

class ReportCache {
  private store = new Map<string, CacheEntry>();

  private key(companyId: string, reportType: string, suffix = '*'): string {
    return `report:${companyId}:${reportType}:${suffix}`;
  }

  get<T>(companyId: string, reportType: string, suffix = '*'): T | undefined {
    const entry = this.store.get(this.key(companyId, reportType, suffix));
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(this.key(companyId, reportType, suffix));
      return undefined;
    }
    return entry.value as T;
  }

  set(companyId: string, reportType: string, value: unknown, suffix = '*', ttlMs = DEFAULT_TTL_MS): void {
    this.store.set(this.key(companyId, reportType, suffix), {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate every cached entry for a company + report type.
   * Real implementation — replaces the old console.log-only stub.
   */
  invalidate(companyId: string, reportType: string): number {
    const prefix = `report:${companyId}:${reportType}:`;
    let removed = 0;
    for (const k of this.store.keys()) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        removed++;
      }
    }
    return removed;
  }

  clearAll(): void {
    this.store.clear();
  }
}

export const reportCache = new ReportCache();
