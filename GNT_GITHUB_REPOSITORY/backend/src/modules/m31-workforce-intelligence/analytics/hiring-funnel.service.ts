/**
 * M31 — analytics/hiring-funnel.service.ts
 * OWN: Hiring pipeline metrics.
 * Naukri-inspired: hiring funnel analytics.
 */

export type FunnelStage = 'APPLIED' | 'SCREENED' | 'INTERVIEWED' | 'OFFERED' | 'HIRED' | 'REJECTED';

export interface FunnelEvent {
  requirementId: string;
  candidateId: string;
  stage: FunnelStage;
  occurredAt: string;
}

export interface FunnelSnapshot {
  requirementId: string;
  counts: Record<FunnelStage, number>;
  conversionRatePct: number; // HIRED / APPLIED
}

export class HiringFunnelService {
  private events: FunnelEvent[] = [];

  record(event: FunnelEvent): void {
    this.events.push(event);
  }

  snapshot(requirementId: string): FunnelSnapshot {
    const relevant = this.events.filter((e) => e.requirementId === requirementId);
    const counts: Record<FunnelStage, number> = {
      APPLIED: 0, SCREENED: 0, INTERVIEWED: 0, OFFERED: 0, HIRED: 0, REJECTED: 0,
    };
    // Count distinct candidates who reached each stage at least once.
    const seenByStage: Record<FunnelStage, Set<string>> = {
      APPLIED: new Set(), SCREENED: new Set(), INTERVIEWED: new Set(),
      OFFERED: new Set(), HIRED: new Set(), REJECTED: new Set(),
    };
    for (const e of relevant) seenByStage[e.stage].add(e.candidateId);
    for (const stage of Object.keys(counts) as FunnelStage[]) counts[stage] = seenByStage[stage].size;

    const conversionRatePct = counts.APPLIED > 0 ? (counts.HIRED / counts.APPLIED) * 100 : 0;
    return { requirementId, counts, conversionRatePct };
  }
}

export const hiringFunnelService = new HiringFunnelService();
