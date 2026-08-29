// M11 Payment Module - Ledger Entry Repository
// WIRING FIX (2026-08-28): this file previously wrote directly to the `ledgerEntry` table,
// which is owned by M10, via `prisma.ledgerEntry.createMany(...)`. That is a direct
// cross-module DB write and violates the blueprint's module-boundary rule
// (a module's tables may only be written by their owner's repository).
//
// This repository is kept ONLY for read-side lookups M11 may legitimately need for its own
// display purposes (e.g. showing linked ledger refs on a payment). It must NEVER call
// `.create` / `.createMany` on ledgerEntry again. Posting new journal entries must go through
// M10's PUBLIC ledger.service.ts contract — see services/ledgerPublicContract.ts.
//
// NEXT STEP (queued): once M10's real ledger.service.ts PUBLIC method signature is confirmed,
// wire NotWiredLedgerContract -> a real adapter that calls it (still no direct table access).

import { PrismaClient, LedgerEntry } from '@prisma/client';

export class LedgerRepository {
  constructor(private prisma: PrismaClient) {}

  /** Read-only: allowed, this only reads M10's table for display, does not write it. */
  async findByTransaction(transactionId: string, tenantId: string): Promise<LedgerEntry[]> {
    return this.prisma.ledgerEntry.findMany({
      where: { transactionId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // create()/createMany() intentionally removed — see file header.
  // Use LedgerPublicContract.postJournalEntries() instead (M10 PUBLIC contract).
}
