// M15 Sync Module — Sync State Repository
// GNT Team C | Modular Monolith Architecture

import { PrismaClient } from '@prisma/client';

export class SyncStateRepository {
  constructor(private prisma: PrismaClient) {}

  async findState(tenantId: string, entityType: string, entityId: string, source: string) {
    return this.prisma.syncState.findUnique({
      where: {
        tenantId_entityType_entityId_source: {
          tenantId, entityType, entityId, source
        }
      }
    });
  }

  async upsertState(tenantId: string, entityType: string, entityId: string, source: string, checksum: string, metadata?: any) {
    return this.prisma.syncState.upsert({
      where: {
        tenantId_entityType_entityId_source: {
          tenantId, entityType, entityId, source
        }
      },
      update: {
        checksum,
        lastSyncedAt: new Date(),
        version: { increment: 1 },
        metadata: metadata as any
      },
      create: {
        tenantId,
        entityType,
        entityId,
        source,
        checksum,
        lastSyncedAt: new Date(),
        version: 1,
        metadata: metadata as any
      }
    });
  }

  async deleteState(tenantId: string, entityType: string, entityId: string, source: string) {
    return this.prisma.syncState.delete({
      where: {
        tenantId_entityType_entityId_source: {
          tenantId, entityType, entityId, source
        }
      }
    });
  }

  async getOutdatedStates(tenantId: string, entityType: string, olderThan: Date) {
    return this.prisma.syncState.findMany({
      where: {
        tenantId,
        entityType,
        lastSyncedAt: { lt: olderThan }
      }
    });
  }
}
