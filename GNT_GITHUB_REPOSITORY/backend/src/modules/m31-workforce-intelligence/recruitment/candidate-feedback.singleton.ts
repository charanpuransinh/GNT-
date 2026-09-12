/**
 * M31 — recruitment/candidate-feedback.singleton.ts
 * Default CandidateFeedbackService wired against the real store.
 */

import { CandidateFeedbackService } from './candidate-feedback.service';
import { realCandidateFeedbackStore } from '../adapters/real-candidate-feedback-store';

export const candidateFeedbackService = new CandidateFeedbackService(realCandidateFeedbackStore);
