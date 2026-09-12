/**
 * M30 — adapters/real-idempotency-store.ts
 * WIRED (2026-09-12): IdempotencyStore backed by the new `idempotency_record`
 * table (migration 023) — genuinely new shared mechanism; existing ad hoc
 * idempotency handling in M08/M22 is untouched.
 */

import { Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import type { IdempotencyRecord, IdempotencyStore } from '../reliability/idempotency.service';

export class RealIdempotencyStore implements IdempotencyStore {
  async find(tenantId: string, key: string): Promise<IdempotencyRecord | null> {
    const row = await prisma.idempotencyRecord.findUnique({ where: { companyId_key: { companyId: tenantId, key } } });
    if (!row) return null;
    return {
      key: row.key,
      tenantId: row.companyId,
      status: row.status as IdempotencyRecord['status'],
      result: row.result,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async save(record: IdempotencyRecord): Promise<void> {
    await prisma.idempotencyRecord.upsert({
      where: { companyId_key: { companyId: record.tenantId, key: record.key } },
      update: { status: record.status, result: record.result as Prisma.InputJsonValue },
      create: { companyId: record.tenantId, key: record.key, status: record.status, result: record.result as Prisma.InputJsonValue },
    });
  }
}

export const realIdempotencyStore = new RealIdempotencyStore();
