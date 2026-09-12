/**
 * M30 — ai/ml-classifier.service.ts
 * OWN: Controlled classification.
 * AI Safety Contract: model/provider/version stored, human override supported.
 *
 * VERIFIED (2026-09-12): no AI/ML SDK (openai/@anthropic-ai/tensorflow) exists in this repo. Correctly left un-instantiated - depends on an injected
 * ClassifierProvider so no specific model API is assumed.
 */

import { AiDataGuard, aiDataGuard, AiRequestContext } from './ai-data-guard';

export interface ClassificationRequest {
  tenantId: string;
  modelKey: string;
  inputFields: Record<string, unknown>;
  allowedFields: string[];
}

export interface ClassificationResult {
  label: string;
  confidence?: number;
  modelKey: string;
  modelVersion: string;
  correlationId: string;
  humanOverridden: boolean;
}

export interface ClassifierProvider {
  classify(modelKey: string, input: Record<string, unknown>): Promise<{ label: string; confidence?: number; modelVersion: string }>;
}

export class MlClassifierService {
  constructor(
    private readonly provider: ClassifierProvider,
    private readonly dataGuard: AiDataGuard = aiDataGuard,
  ) {}

  async classify(request: ClassificationRequest, correlationId: string): Promise<ClassificationResult> {
    const context: AiRequestContext = { tenantId: request.tenantId, allowedFields: request.allowedFields };
    const minimized = this.dataGuard.minimize(request.inputFields, context);
    const result = await this.provider.classify(request.modelKey, minimized);

    return {
      label: result.label,
      confidence: result.confidence,
      modelKey: request.modelKey,
      modelVersion: result.modelVersion,
      correlationId,
      humanOverridden: false,
    };
  }

  /** Human override — no self-authorization by the AI (Rule: NO SELF-AUTHORIZATION). */
  applyHumanOverride(result: ClassificationResult, overrideLabel: string): ClassificationResult {
    return { ...result, label: overrideLabel, humanOverridden: true };
  }
}
