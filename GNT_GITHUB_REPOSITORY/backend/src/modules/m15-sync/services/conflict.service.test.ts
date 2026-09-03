// ============================================================================
// M15 — ConflictService के unit tests (टास्क #024 — F1: पुराने jest-टूटे tests
// की जगह असली API पर नए node:test tests; DB की जगह सादे mock objects)
// ============================================================================

import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { ConflictService } from './conflict.service';
import type { SyncConflict } from '../types/sync.types';

function makeConflict(overrides: Partial<SyncConflict> = {}): SyncConflict {
  return {
    id: 'conflict-1',
    tenantId: 'tenant-1',
    syncJobId: 'job-1',
    entityType: 'product',
    internalId: 'prod-1',
    externalId: 'ext-1',
    internalValue: { name: 'local-name', price: 100 },
    externalValue: { name: 'remote-name', price: 90 },
    status: 'PENDING',
    createdAt: new Date(),
    ...overrides,
  } as SyncConflict;
}

function makeMocks() {
  const calls: string[] = [];
  const prisma = {
    syncConflict: {
      findMany: async (args: Record<string, unknown>) => {
        calls.push(`findMany:${JSON.stringify(args)}`);
        return [makeConflict()];
      },
      findFirst: async (args: Record<string, unknown>): Promise<SyncConflict | null> => {
        calls.push(`findFirst:${JSON.stringify(args)}`);
        return makeConflict();
      },
      count: async (args: Record<string, unknown>) => {
        calls.push(`count:${JSON.stringify(args)}`);
        return 5;
      },
      update: async (args: Record<string, unknown>) => {
        calls.push(`update:${JSON.stringify(args)}`);
        return makeConflict({ status: 'RESOLVED' });
      },
    },
    syncQueueItem: {
      create: async (args: Record<string, unknown>) => {
        calls.push(`queue:${JSON.stringify(args)}`);
        return { id: 'queue-1' };
      },
    },
  };
  const emitter = { emit: (name: string, payload: Record<string, unknown>) => void calls.push(`emit:${name}:${JSON.stringify(payload)}`) };
  return { prisma, emitter, calls };
}

describe('ConflictService.getAllConflicts', () => {
  it('tenant + page/limit के साथ findMany/count बुलाता है और meta बनाता है', async () => {
    const { prisma, emitter, calls } = makeMocks();
    const service = new ConflictService(prisma as never, emitter as never);

    const result = await service.getAllConflicts('tenant-1', { page: 2, limit: 20 });

    assert.equal(result.conflicts.length, 1);
    assert.equal(result.meta.page, 2);
    assert.equal(result.meta.totalPages, 1); // ceil(5/20)
    assert.ok(calls.some((c) => c.startsWith('findMany:') && c.includes('"skip":20')));
    assert.ok(calls.some((c) => c.startsWith('count:') && c.includes('tenant-1')));
  });
});

describe('ConflictService.resolveConflict', () => {
  it('INTERNAL_WINS: internalValue लेता है, status RESOLVED करता है, queue बनाता है, event भेजता है', async () => {
    const { prisma, emitter, calls } = makeMocks();
    const service = new ConflictService(prisma as never, emitter as never);

    const updated = await service.resolveConflict(
      'tenant-1',
      'conflict-1',
      { resolution: 'INTERNAL_WINS' } as never,
      'user-1',
    );

    assert.equal(updated.status, 'RESOLVED');
    assert.ok(calls.some((c) => c.startsWith('update:') && c.includes('"status":"RESOLVED"')));
    assert.ok(calls.some((c) => c.startsWith('queue:') && c.includes('"operation":"push"')));
    assert.ok(calls.some((c) => c.startsWith('emit:conflict.resolved') && c.includes('conflict-1')));
  });

  it('MANUAL बिना mergedValue → 400', async () => {
    const { prisma, emitter } = makeMocks();
    const service = new ConflictService(prisma as never, emitter as never);

    await assert.rejects(
      () => service.resolveConflict('tenant-1', 'conflict-1', { resolution: 'MANUAL', mergedValue: undefined } as never, 'user-1'),
      (err: unknown) => (err as { statusCode?: number }).statusCode === 400,
    );
  });

  it('conflict न मिले → 404', async () => {
    const { prisma, emitter } = makeMocks();
    prisma.syncConflict.findFirst = async () => null;
    const service = new ConflictService(prisma as never, emitter as never);

    await assert.rejects(
      () => service.resolveConflict('tenant-1', 'ghost', { resolution: 'INTERNAL_WINS' } as never, 'user-1'),
      (err: unknown) => (err as { statusCode?: number }).statusCode === 404,
    );
  });
});

describe('ConflictService.ignoreConflict', () => {
  it('status ignored करता है और event भेजता है', async () => {
    const { prisma, emitter, calls } = makeMocks();
    prisma.syncConflict.update = async (args: Record<string, unknown>) => {
      calls.push(`update:${JSON.stringify(args)}`);
      return makeConflict({ status: 'AUTO_RESOLVED' });
    };
    const service = new ConflictService(prisma as never, emitter as never);

    const updated = await service.ignoreConflict('tenant-1', 'conflict-1');

    assert.equal(updated.status, 'AUTO_RESOLVED');
    assert.ok(calls.some((c) => c.startsWith('emit:conflict.ignored')));
  });
});

describe('ConflictService.getConflictStats', () => {
  it('चारों गिनतियाँ tenant के दायरे में', async () => {
    const { prisma, emitter, calls } = makeMocks();
    const service = new ConflictService(prisma as never, emitter as never);

    const stats = await service.getConflictStats('tenant-1');

    assert.equal(stats.total, 5);
    assert.equal(stats.open, 5);
    // हर count tenant-1 के साथ गया (tenant-safe)
    const countCalls = calls.filter((c) => c.startsWith('count:'));
    assert.equal(countCalls.length, 4);
    assert.ok(countCalls.every((c) => c.includes('tenant-1')));
  });
});
