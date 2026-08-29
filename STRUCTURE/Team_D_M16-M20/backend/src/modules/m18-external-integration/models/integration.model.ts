/**
 * M18 — Prisma Model Extensions
 * Owner: D4-DELTA
 */
import { Prisma } from '@prisma/client';

export const integrationConfigExtension = Prisma.defineExtension({
  model: {
    integration_config: {
      async findByCompany(companyId: string) {
        return Prisma.getExtensionContext(this).findMany({
          where: { company_id: companyId },
          orderBy: { created_at: 'desc' },
        });
      },
      async findActiveByType(companyId: string, type: string) {
        return Prisma.getExtensionContext(this).findFirst({
          where: {
            company_id: companyId,
            type,
            is_active: true,
          },
        });
      },
    },
  },
});

export const apiKeyRegistryExtension = Prisma.defineExtension({
  model: {
    api_key_registry: {
      async findValidByCompany(companyId: string) {
        const now = new Date();
        return Prisma.getExtensionContext(this).findMany({
          where: {
            company_id: companyId,
            OR: [
              { expires_at: null },
              { expires_at: { gt: now } },
            ],
          },
          orderBy: { created_at: 'desc' },
        });
      },
    },
  },
});

export const webhookLogExtension = Prisma.defineExtension({
  model: {
    webhook_log: {
      async findRecentByProvider(provider: string, limit: number = 50) {
        return Prisma.getExtensionContext(this).findMany({
          where: { provider },
          orderBy: { created_at: 'desc' },
          take: limit,
        });
      },
    },
  },
});
