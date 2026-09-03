// M13 Automation API — DB-gated integration smoke (टास्क #025 A4)
// असली subject-tests database चालू होने पर (TEST_DB=1) इसी group में जुड़ेंगे;
// अभी vitest इन्हें 'skipped' में गिनता है (it.skip का silent छिपाव नहीं)।
import { describe, it, expect } from 'vitest';
import { prisma } from '@/common/config/prisma';

describe.runIf(process.env.TEST_DB === '1')('M13 Automation API (DB — integration)', () => {
  it('database reachable है', async () => {
    await expect(prisma.$queryRaw`SELECT 1`).resolves.toBeDefined();
  });
});
