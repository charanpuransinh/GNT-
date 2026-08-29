// M15 Sync Module — Unit Tests: Sync Service
// GNT Team C | Modular Monolith Architecture

import { SyncService } from '../../src/services/sync.service';
import { SyncRepository } from '../../src/repositories/sync.repository';
import { SyncStateRepository } from '../../src/repositories/sync-state.repository';
import { EventEmitter } from '../../src/events/sync.emitter';

// Mock Prisma
const mockPrisma = {
  syncJob: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  syncLog: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn()
  },
  syncConflict: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn()
  },
  backupJob: {
    count: jest.fn()
  }
};

const mockSyncRepo = {
  getJobWithLogs: jest.fn(),
  getActiveJobs: jest.fn(),
  getJobsByCron: jest.fn()
};

const mockStateRepo = {
  findState: jest.fn(),
  upsertState: jest.fn(),
  deleteState: jest.fn(),
  getOutdatedStates: jest.fn()
};

const mockEmitter = {
  emit: jest.fn()
};

describe('SyncService', () => {
  let service: SyncService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SyncService(
      mockPrisma as any,
      mockSyncRepo as any,
      mockStateRepo as any,
      mockEmitter as any
    );
  });

  describe('getAllJobs', () => {
    it('should return paginated sync jobs', async () => {
      const mockJobs = [
        { id: '1', name: 'Daily Sync', tenantId: 't1', status: 'idle' }
      ];
      mockPrisma.syncJob.findMany.mockResolvedValue(mockJobs);
      mockPrisma.syncJob.count.mockResolvedValue(1);

      const result = await service.getAllJobs('t1', { page: 1, limit: 20 });

      expect(result.jobs).toEqual(mockJobs);
      expect(result.meta.total).toBe(1);
      expect(mockPrisma.syncJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 't1' } })
      );
    });
  });

  describe('createJob', () => {
    it('should create a new sync job', async () => {
      const dto = {
        name: 'Test Sync',
        source: 'local',
        target: 'cloud',
        syncType: 'delta' as const
      };
      const mockJob = { id: '1', ...dto, tenantId: 't1' };
      mockPrisma.syncJob.create.mockResolvedValue(mockJob);

      const result = await service.createJob('t1', dto);

      expect(result.name).toBe('Test Sync');
      expect(mockEmitter.emit).toHaveBeenCalledWith('sync.job.created', expect.any(Object));
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      mockPrisma.syncJob.count.mockResolvedValue(5);
      mockPrisma.syncConflict.count.mockResolvedValue(2);
      mockPrisma.backupJob.count.mockResolvedValue(3);
      mockPrisma.syncLog.findMany.mockResolvedValue([]);
      mockPrisma.syncConflict.findMany.mockResolvedValue([]);
      mockPrisma.syncLog.findFirst.mockResolvedValue(null);

      const stats = await service.getDashboardStats('t1');

      expect(stats.totalSyncJobs).toBe(5);
      expect(stats.pendingConflicts).toBe(2);
      expect(stats.totalBackups).toBe(3);
    });
  });
});
