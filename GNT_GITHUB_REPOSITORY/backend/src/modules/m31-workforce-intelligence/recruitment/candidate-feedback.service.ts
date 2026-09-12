/**
 * M31 — recruitment/candidate-feedback.service.ts
 * OWN: Learn from authorized manager decisions.
 * Naukri-inspired: Good Fit / Maybe / Not Fit feedback, feedback-driven
 * calibration. Backs table: candidate_feedback (proposed, tenant-owned).
 */

export type FeedbackDecision = 'GOOD_FIT' | 'MAYBE' | 'NOT_FIT';

export interface CandidateFeedback {
  feedbackId: string;
  tenantId: string;
  candidateId: string;
  requirementId: string;
  managerId: string;
  decision: FeedbackDecision;
  reason?: string;
  recordedAt: string;
}

export interface CandidateFeedbackStore {
  insert(feedback: CandidateFeedback): Promise<void>;
  listForRequirement(requirementId: string, tenantId: string): Promise<CandidateFeedback[]>;
}

export class CandidateFeedbackService {
  constructor(private readonly store: CandidateFeedbackStore) {}

  async record(input: Omit<CandidateFeedback, 'feedbackId' | 'recordedAt'>): Promise<CandidateFeedback> {
    const feedback: CandidateFeedback = {
      ...input,
      feedbackId: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      recordedAt: new Date().toISOString(),
    };
    await this.store.insert(feedback);
    return feedback;
  }

  /** Aggregate decision rate for a requirement — used as calibration input, not auto-applied. */
  async decisionRate(requirementId: string, tenantId: string): Promise<Record<FeedbackDecision, number>> {
    const all = await this.store.listForRequirement(requirementId, tenantId);
    const counts: Record<FeedbackDecision, number> = { GOOD_FIT: 0, MAYBE: 0, NOT_FIT: 0 };
    for (const f of all) counts[f.decision] += 1;
    return counts;
  }
}
