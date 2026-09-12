/**
 * M30 — AI/ML Guards & Reliability
 * index.ts — Public M30 exports.
 *
 * integration-manager.service.ts, payment-gateway.service.ts and
 * webhook-manager.service.ts from the original blueprint are intentionally
 * NOT exported — see M30_INTEGRATION_NOTES.md.
 */

export { AiDataGuard, aiDataGuard, AiDataGuardViolationError, type AiRequestContext } from './ai/ai-data-guard';
export { MlClassifierService, type ClassificationRequest, type ClassificationResult, type ClassifierProvider } from './ai/ml-classifier.service';
export { FraudDetectorService, type FraudScoringRequest, type FraudScore, type FraudModelProvider } from './ai/fraud-detector.service';
export { ForecastService, type ForecastRequest, type ForecastPoint, type ForecastProvider } from './ai/forecast.service';

export { BankApiService, type BankStatementLine, type BankApiClient } from './integrations/bank-api.service';

export { RetryService, retryService, RetryExhaustedError, type RetryOptions } from './reliability/retry.service';
export { TimeoutService, timeoutService, TimeoutError } from './reliability/timeout.service';
export { IdempotencyService, idempotencyService, type IdempotencyRecord, type IdempotencyStore } from './reliability/idempotency.service';
