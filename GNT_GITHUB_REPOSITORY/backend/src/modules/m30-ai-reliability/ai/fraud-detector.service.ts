/**
 * M30 — ai/fraud-detector.service.ts
 * OWN: Anomaly/fraud scoring.
 * Rule 9 (Global Rules): AI may recommend/score — business-critical actions
 * require configured human approval unless owner enables autonomous execution.
 */

import { AiDataGuard, aiDataGuard, AiRequestContext } from './ai-data-guard';

export interface FraudScoringRequest {
  tenantId: string;
  transactionFields: Record<string, unknown>;
  allowedFields: string[];
}

export interface FraudScore {
  score: number; // 0-100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  contributingFactors: string[];
  requiresHumanApproval: boolean;
}

export interface FraudModelProvider {
  score(input: Record<string, unknown>): Promise<{ score: number; contributingFactors: string[] }>;
}

const HIGH_RISK_THRESHOLD = 75;
const MEDIUM_RISK_THRESHOLD = 40;

export class FraudDetectorService {
  constructor(
    private readonly provider: FraudModelProvider,
    private readonly dataGuard: AiDataGuard = aiDataGuard,
  ) {}

  async assess(request: FraudScoringRequest): Promise<FraudScore> {
    const context: AiRequestContext = { tenantId: request.tenantId, allowedFields: request.allowedFields };
    const minimized = this.dataGuard.minimize(request.transactionFields, context);
    const { score, contributingFactors } = await this.provider.score(minimized);

    const riskLevel = score >= HIGH_RISK_THRESHOLD ? 'HIGH' : score >= MEDIUM_RISK_THRESHOLD ? 'MEDIUM' : 'LOW';

    return {
      score,
      riskLevel,
      contributingFactors,
      // AI never auto-blocks a financial transaction by itself — flags for approval.
      requiresHumanApproval: riskLevel !== 'LOW',
    };
  }
}
