// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION — UTILITIES
// Module: M13 | Layer: Utils
// ============================================================================

/**
 * Generate a unique job identifier.
 */
export function generateJobId(): string {
  return `m13-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize automation payload to prevent injection.
 * NOT SPECIFIED: Full sanitization rules per security audit v2.1
 */
export function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  // Placeholder: Deep clone to avoid mutation
  return JSON.parse(JSON.stringify(payload));
}

/**
 * Validate cron expression format.
 * NOT SPECIFIED: Full cron parser integration per roadmap v2.1
 */
export function parseCronExpression(cronExpr: string): boolean {
  // Placeholder: Basic 5-field cron check
  const parts = cronExpr.trim().split(/\s+/);
  return parts.length === 5 || parts.length === 6;
}

/**
 * Calculate exponential backoff delay.
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelayMs: number = 5000
): number {
  return baseDelayMs * Math.pow(2, retryCount - 1);
}

/**
 * Check if a job status is terminal (cannot change further).
 */
export function isTerminalStatus(status: string): boolean {
  return ["COMPLETED", "FAILED", "CANCELLED"].includes(status);
}
