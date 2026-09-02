import { AsyncLocalStorage } from 'node:async_hooks';
import { AuditService, AuditRepository } from '@/modules/m19-production-monitoring';
import { prisma } from '@/common/config/prisma';

/**
 * GNT — Audit Logger (टास्क #014)
 *
 * पहले सिर्फ console.info करता था (restart पर सब खो जाता था)।
 * अब दोनों काम करता है:
 *   1. console (पहले वाला रास्ता — हटाया नहीं)
 *   2. M19 की AuditService के ज़रिए database में append-only entry
 *
 * नियम:
 *   - audit गड़बड़ ≠ business गड़बड़ → DB write fire-and-forget + catch, काम नहीं रुकता
 *   - company_id अनिवार्य → context/entry से न मिले तो DB में गलत entry नहीं लिखते (console ही रहता है)
 *   - user_id/ip/user-agent request context (AsyncLocalStorage) से आते हैं — middleware भरता है
 */

export interface AuditEntry {
  action: string;
  target?: string;
  module?: string;
  resource?: string;
  companyId?: string;
  userId?: string;
  [key: string]: unknown;
}

export interface AuditRequestContext {
  companyId?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditContext = new AsyncLocalStorage<AuditRequestContext>();

const auditService = new AuditService(new AuditRepository(prisma));

export class AuditLogger {
  log(entry: AuditEntry): void {
    // console path — हमेशा रहेगा
    console.info(JSON.stringify({ type: 'audit', ...entry, timestamp: new Date().toISOString() }));

    const ctx = auditContext.getStore();
    const companyId = (entry.companyId as string) ?? ctx?.companyId;
    if (!companyId) return; // company_id अनिवार्य — उपलब्ध न हो तो DB में entry नहीं

    void auditService
      .logAction({
        companyId,
        userId: (entry.userId as string) ?? ctx?.userId,
        action: entry.action,
        module: (entry.module as string) ?? 'core',
        resource: (entry.resource as string) ?? (entry.target as string) ?? entry.action,
        resourceId: (entry.target as string) ?? undefined,
        ipAddress: ctx?.ipAddress,
        userAgent: ctx?.userAgent,
      })
      .catch((err: unknown) => {
        // audit की चूक खुद दर्ज हो (business unaffected)
        console.error('[audit] DB write failed (business unaffected):', err instanceof Error ? err.message : err);
      });
  }
}

export const auditLogger = new AuditLogger();
