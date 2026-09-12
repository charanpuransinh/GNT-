/**
 * M31 — recruitment/interview-assistant.service.ts
 * OWN: Prepare interview plans and structured scoring.
 * Backs table: interview_evaluation (proposed, tenant-owned).
 */

import { SkillRequirement } from '../talent/skill-matching.service';

export interface InterviewPlan {
  planId: string;
  candidateId: string;
  focusAreas: string[]; // derived from skillRequirements
  suggestedDurationMinutes: number;
}

export interface InterviewScoreEntry {
  focusArea: string;
  score: number; // 0-10
  notes?: string;
}

export interface InterviewEvaluation {
  evaluationId: string;
  planId: string;
  candidateId: string;
  interviewerId: string;
  scores: InterviewScoreEntry[];
  overallScore: number;
  recommendation: 'GOOD_FIT' | 'MAYBE' | 'NOT_FIT';
}

const RECOMMENDATION_GOOD_FIT_THRESHOLD = 7;
const RECOMMENDATION_MAYBE_THRESHOLD = 4.5;

export class InterviewAssistantService {
  buildPlan(candidateId: string, requirements: SkillRequirement[]): InterviewPlan {
    return {
      planId: `ivp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      candidateId,
      focusAreas: requirements.map((r) => r.skillId),
      suggestedDurationMinutes: Math.max(30, requirements.length * 10),
    };
  }

  /** Human-entered scores — the AI never scores a candidate autonomously (Rule 9). */
  evaluate(plan: InterviewPlan, interviewerId: string, scores: InterviewScoreEntry[]): InterviewEvaluation {
    const overallScore = scores.length > 0 ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length : 0;
    const recommendation: InterviewEvaluation['recommendation'] =
      overallScore >= RECOMMENDATION_GOOD_FIT_THRESHOLD
        ? 'GOOD_FIT'
        : overallScore >= RECOMMENDATION_MAYBE_THRESHOLD
          ? 'MAYBE'
          : 'NOT_FIT';

    return {
      evaluationId: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      planId: plan.planId,
      candidateId: plan.candidateId,
      interviewerId,
      scores,
      overallScore,
      recommendation,
    };
  }
}

export const interviewAssistantService = new InterviewAssistantService();
