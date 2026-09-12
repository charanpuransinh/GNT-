/**
 * M30 — reliability/timeout.service.ts
 * OWN: External call timeout policy.
 */

export class TimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

export class TimeoutService {
  async withTimeout<T>(operation: () => Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new TimeoutError(timeoutMs)), timeoutMs);
    });

    try {
      return await Promise.race([operation(), timeoutPromise]);
    } finally {
      clearTimeout(timer!);
    }
  }
}

export const timeoutService = new TimeoutService();
