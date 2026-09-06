// M19 — Audit trail END-TO-END: logAction → audit_log me asli row → query (tenant-scoped)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/common/config/prisma';
import { AuditRepository } from '../../repositories/audit.repository';
import { AuditService } from '../../services/audit.service';

const COMPANY_ID = '00000000-0000-4000-8000-000000000053';
const OTHER_ID = '00000000-0000-4000-8000-000000000054';

async function cleanup() {
  await prisma.auditLog.deleteMany({ where: { companyId: { in: [COMPANY_ID, OTHER_ID] } } });
}

describe.runIf(process.env.TEST_DB === '1')('M19 audit end-to-end — live DB', () => {
  beforeAll(cleanup);
  afterAll(cleanup);

  it('logAction → query asli row wapas deta hai (tenant-scoped)', async () => {
    const svc = new AuditService(new AuditRepository(prisma));

    await svc.logAction({
      companyId: COMPANY_ID, userId: 'u1', action: 'CREATE', module: 'M08',
      resource: 'invoice', resourceId: 'inv-1',
    });

    const result = await svc.queryAuditLogs({ companyId: COMPANY_ID });
    expect(result.total).toBe(1);
    expect(result.data[0].action).toBe('CREATE');
    expect(result.data[0].module).toBe('M08');

    // doosre tenant ko nahi dikhta
    const other = await svc.queryAuditLogs({ companyId: OTHER_ID });
    expect(other.total).toBe(0);
  });
});
