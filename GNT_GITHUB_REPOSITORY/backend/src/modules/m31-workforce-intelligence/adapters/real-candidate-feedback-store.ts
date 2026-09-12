/**
 * M31 — adapters/real-candidate-feedback-store.ts
 * WIRED (2026-09-12): CandidateFeedbackStore backed by the new
 * `candidate_feedback` table (migration 024).
 */

import { prisma } from '@/common/config/prisma';
import type { CandidateFeedback, CandidateFeedbackStore } from '../recruitment/candidate-feedback.service';

export class RealCandidateFeedbackStore implements CandidateFeedbackStore {
  async insert(feedback: CandidateFeedback): Promise<void> {
    await prisma.candidateFeedback.create({
      data: {
        id: feedback.feedbackId,
        companyId: feedback.tenantId,
        candidateId: feedback.candidateId,
        requirementId: feedback.requirementId,
        managerId: feedback.managerId,
        decision: feedback.decision,
        reason: feedback.reason,
        recordedAt: new Date(feedback.recordedAt),
      },
    });
  }

  async listForRequirement(requirementId: string, tenantId: string): Promise<CandidateFeedback[]> {
    const rows = await prisma.candidateFeedback.findMany({ where: { requirementId, companyId: tenantId } });
    return rows.map((row) => ({
      feedbackId: row.id,
      tenantId: row.companyId,
      candidateId: row.candidateId,
      requirementId: row.requirementId,
      managerId: row.managerId,
      decision: row.decision as CandidateFeedback['decision'],
      reason: row.reason ?? undefined,
      recordedAt: row.recordedAt.toISOString(),
    }));
  }
}

export const realCandidateFeedbackStore = new RealCandidateFeedbackStore();
