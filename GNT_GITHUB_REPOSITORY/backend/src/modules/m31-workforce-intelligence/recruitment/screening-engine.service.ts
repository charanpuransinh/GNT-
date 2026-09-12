/**
 * M31 — recruitment/screening-engine.service.ts
 * OWN: Create/evaluate configurable screening questions.
 * Backs table: screening_template (proposed, tenant-owned).
 */

export interface ScreeningQuestion {
  questionId: string;
  text: string;
  expectedSkillId?: string;
  weight: number;
}

export interface ScreeningTemplate {
  templateId: string;
  tenantId: string;
  requirementId: string;
  questions: ScreeningQuestion[];
}

export interface ScreeningAnswer {
  questionId: string;
  answerText: string;
  score: number; // 0-100, scored by a human reviewer or a verified AI scorer
}

export interface ScreeningResult {
  templateId: string;
  candidateId: string;
  overallScorePct: number;
}

export class ScreeningEngineService {
  buildTemplate(tenantId: string, requirementId: string, questions: Omit<ScreeningQuestion, 'questionId'>[]): ScreeningTemplate {
    return {
      templateId: `scr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      tenantId,
      requirementId,
      questions: questions.map((q) => ({ ...q, questionId: `q_${Math.random().toString(36).slice(2, 10)}` })),
    };
  }

  evaluate(template: ScreeningTemplate, candidateId: string, answers: ScreeningAnswer[]): ScreeningResult {
    const answerMap = new Map(answers.map((a) => [a.questionId, a]));
    let totalWeight = 0;
    let earnedWeight = 0;

    for (const question of template.questions) {
      totalWeight += question.weight;
      const answer = answerMap.get(question.questionId);
      if (answer) {
        earnedWeight += (answer.score / 100) * question.weight;
      }
    }

    return {
      templateId: template.templateId,
      candidateId,
      overallScorePct: totalWeight > 0 ? (earnedWeight / totalWeight) * 100 : 0,
    };
  }
}

export const screeningEngineService = new ScreeningEngineService();
