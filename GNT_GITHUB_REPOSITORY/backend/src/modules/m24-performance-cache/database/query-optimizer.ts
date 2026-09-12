/**
 * M24 — database/query-optimizer.ts
 * OWN: Detect expensive query patterns and recommend/execute approved
 * optimization. Read/analysis-only by default — never mutates schema itself.
 */

export interface QueryExecutionSample {
  queryName: string;
  durationMs: number;
  rowsExamined?: number;
  rowsReturned?: number;
}

export interface OptimizationRecommendation {
  queryName: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  reason: string;
}

const SLOW_QUERY_THRESHOLD_MS = 500;
const HIGH_SCAN_RATIO = 50; // rowsExamined / rowsReturned considered inefficient above this

export class QueryOptimizer {
  private samples: QueryExecutionSample[] = [];

  record(sample: QueryExecutionSample): void {
    this.samples.push(sample);
  }

  /** Analyze recorded samples and produce non-destructive recommendations. */
  analyze(): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    for (const sample of this.samples) {
      if (sample.durationMs >= SLOW_QUERY_THRESHOLD_MS) {
        recommendations.push({
          queryName: sample.queryName,
          severity: sample.durationMs >= SLOW_QUERY_THRESHOLD_MS * 2 ? 'HIGH' : 'MEDIUM',
          reason: `Query duration ${sample.durationMs}ms exceeds threshold ${SLOW_QUERY_THRESHOLD_MS}ms`,
        });
      }

      if (sample.rowsExamined && sample.rowsReturned && sample.rowsReturned > 0) {
        const ratio = sample.rowsExamined / sample.rowsReturned;
        if (ratio >= HIGH_SCAN_RATIO) {
          recommendations.push({
            queryName: sample.queryName,
            severity: 'MEDIUM',
            reason: `High scan ratio ${ratio.toFixed(1)}x — consider an index (verify against index-manager before applying)`,
          });
        }
      }
    }

    return recommendations;
  }

  clear(): void {
    this.samples = [];
  }
}

export const queryOptimizer = new QueryOptimizer();
