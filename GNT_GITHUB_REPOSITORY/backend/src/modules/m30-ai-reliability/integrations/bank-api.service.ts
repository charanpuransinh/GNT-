/**
 * M30 — integrations/bank-api.service.ts
 * OWN: Bank API adapter.
 *
 * VERIFIED (2026-09-12): no bank-statement API library/credentials exist
 * anywhere in this repo (checked package.json + M11's real bank
 * reconciliation code — it processes already-fetched statement lines, it
 * never fetches from a live bank API itself). This is genuinely new
 * capability, not a duplicate of anything. Correctly left un-instantiated
 * (no default singleton) — a real `BankApiClient` needs real bank
 * credentials, which don't exist here; fabricating one would be guessing.
 * Never a live financial-posting path itself — Rule (Billing/Financial
 * Safety, Section 28): M30 requests financial operations only through
 * M08/M09/M11's approved contracts, never by writing ledgers directly.
 */

import { RetryService, retryService } from '../reliability/retry.service';
import { TimeoutService, timeoutService } from '../reliability/timeout.service';

export interface BankStatementLine {
  externalRef: string;
  amount: number;
  currency: string;
  valueDate: string;
  description: string;
}

export interface BankApiClient {
  fetchStatement(tenantId: string, accountRef: string, fromDate: string, toDate: string): Promise<BankStatementLine[]>;
}

export class BankApiService {
  constructor(
    private readonly client: BankApiClient,
    private readonly retry: RetryService = retryService,
    private readonly timeout: TimeoutService = timeoutService,
  ) {}

  /** Read-only fetch — reconciliation/posting decisions belong to M11, not here. */
  async fetchStatement(tenantId: string, accountRef: string, fromDate: string, toDate: string): Promise<BankStatementLine[]> {
    return this.retry.withRetry(() =>
      this.timeout.withTimeout(() => this.client.fetchStatement(tenantId, accountRef, fromDate, toDate), 10000),
    );
  }
}
