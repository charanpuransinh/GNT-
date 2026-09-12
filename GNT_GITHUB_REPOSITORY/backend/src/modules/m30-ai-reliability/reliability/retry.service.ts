/**
 * M30 — reliability/retry.service.ts
 * OWN: Controlled retries.
 * Rule 12: external service failure must not corrupt GNT transaction state.
 */

export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

const DEFAULT_OPTIONS: RetryOptions = { maxAttempts: 3, baseDelayMs: 200, maxDelayMs: 5000 };

export class RetryExhaustedError extends Error {
  constructor(public readonly attempts: number, public readonly lastError: unknown) {
    super(`Retry exhausted after ${attempts} attempts`);
    this.name = 'RetryExhaustedError';
  }
}

export class RetryService {
  async withRetry<T>(operation: () => Promise<T>, options: Partial<RetryOptions> = {}): Promise<T> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    let lastError: unknown;

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (err) {
        lastError = err;
        if (attempt === opts.maxAttempts) break;
        const delay = Math.min(opts.baseDelayMs * 2 ** (attempt - 1), opts.maxDelayMs);
        await this.sleep(delay);
      }
    }
    throw new RetryExhaustedError(opts.maxAttempts, lastError);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const retryService = new RetryService();
