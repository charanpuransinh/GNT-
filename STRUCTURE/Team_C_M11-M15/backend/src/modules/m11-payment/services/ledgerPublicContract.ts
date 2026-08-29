// M11 Payment Module - PUBLIC contract seam into M10 Accounting
// WIRING FIX (2026-08-28): M11 must NEVER write to the `ledgerEntry` table directly —
// that table is owned by M10. The old ledger.repository.ts did `prisma.ledgerEntry.createMany(...)`
// straight from M11, which is a direct cross-module DB write (forbidden by the blueprint's
// module-boundary rule). This file replaces that with an injectable PUBLIC-contract interface.
//
// STATUS: BLOCKED — not wired to the real M10 ledger.service.ts yet, because M10's exact
// PUBLIC method name/signature was not present in the material available for this pass.
// Until Krisna confirms it (or M10's module is supplied), this throws a clear error instead
// of silently doing nothing or faking success.

export interface LedgerJournalLine {
  transactionId: string;
  accountCode: string;
  debitAmount: unknown;   // Decimal, kept as unknown here to avoid importing M10's types
  creditAmount: unknown;
  narration: string;
  entryDate: Date;
  fiscalYearId?: string;
}

export interface LedgerPublicContract {
  postJournalEntries(entries: LedgerJournalLine[], tenantId: string, userId: string): Promise<void>;
}

export class LedgerContractNotWiredError extends Error {
  constructor(caller: string) {
    super(
      `[M11->M10 BLOCKED] ${caller} tried to post ledger entries, but M10's PUBLIC ` +
      `ledger.service.ts contract is not wired into M11 yet. Do not write to ledgerEntry ` +
      `directly from M11 — inject a real LedgerPublicContract implementation instead.`
    );
    this.name = 'LedgerContractNotWiredError';
  }
}

/** Default stub — safe placeholder until M10's PUBLIC service is injected at composition root. */
export class NotWiredLedgerContract implements LedgerPublicContract {
  async postJournalEntries(): Promise<void> {
    throw new LedgerContractNotWiredError('PaymentService.processPayment');
  }
}
