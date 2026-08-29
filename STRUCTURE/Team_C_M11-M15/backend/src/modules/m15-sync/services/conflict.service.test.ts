// M15 Sync Module — Unit Tests: Conflict Service
// GNT Team C | Modular Monolith Architecture

import { ConflictService } from '../../src/services/conflict.service';

const mockPrisma = {
  syncConflict: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  },
  syncQueueItem: {
    create: jest.fn()
  }
};

const mockEmitter = { emit: jest.fn() };

describe('ConflictService', () => {
  let service: ConflictService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ConflictService(mockPrisma as any, mockEmitter as any);
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with local_wins strategy', async () => {
      const conflict = {
        id: 'c1',
        tenantId: 't1',
        localVersion: { name: 'Local' },
        remoteVersion: { name: 'Remote' },
        status: 'open'
      };
      mockPrisma.syncConflict.findFirst.mockResolvedValue(conflict);
      mockPrisma.syncConflict.update.mockResolvedValue({ ...conflict, status: 'resolved' });

      const result = await service.resolveConflict('t1', 'c1', {
        resolution: 'local_wins'
      }, 'user-1');

      expect(result.status).toBe('resolved');
      expect(mockEmitter.emit).toHaveBeenCalledWith('conflict.resolved', expect.any(Object));
    });

    it('should throw if conflict already resolved', async () => {
      mockPrisma.syncConflict.findFirst.mockResolvedValue({
        id: 'c1', status: 'resolved'
      });

      await expect(service.resolveConflict('t1', 'c1', {
        resolution: 'local_wins'
      }, 'user-1')).rejects.toThrow('Conflict already resolved');
    });
  });

  describe('getConflictStats', () => {
    it('should return conflict statistics', async () => {
      mockPrisma.syncConflict.count
        .mockResolvedValueOnce(5)  // open
        .mockResolvedValueOnce(10) // resolved
        .mockResolvedValueOnce(2)  // ignored
        .mockResolvedValueOnce(17); // total

      const stats = await service.getConflictStats('t1');

      expect(stats.open).toBe(5);
      expect(stats.resolved).toBe(10);
      expect(stats.ignored).toBe(2);
      expect(stats.total).toBe(17);
    });
  });
});
