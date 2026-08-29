import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { appController } from '../../controllers/app.controller';
import { appService } from '../../services/app.service';

vi.mock('../../services/app.service');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.requestId = 'test-request-id';
  next();
});
app.get('/api/v1/foundation/health', appController.getHealth);
app.get('/api/v1/foundation/maintenance', appController.checkMaintenance);

describe('M01 - API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/foundation/health', () => {
    it('should return 200 with healthy status', async () => {
      vi.mocked(appService.getHealthStatus).mockResolvedValue({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: 123,
        version: '1.0.0',
        checks: { database: true, cache: true, storage: true },
      });

      const response = await request(app)
        .get('/api/v1/foundation/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
      expect(response.body.meta.requestId).toBe('test-request-id');
      expect(response.body.meta.timestamp).toBeDefined();
    });

    it('should return 503 when system is down', async () => {
      vi.mocked(appService.getHealthStatus).mockResolvedValue({
        status: 'down',
        timestamp: new Date().toISOString(),
        uptime: 0,
        version: '1.0.0',
        checks: { database: false, cache: false, storage: false },
      });

      const response = await request(app)
        .get('/api/v1/foundation/health')
        .expect(503);

      expect(response.body.data.status).toBe('down');
    });
  });

  describe('GET /api/v1/foundation/maintenance', () => {
    it('should return maintenance status', async () => {
      vi.mocked(appService.checkMaintenanceMode).mockResolvedValue({
        maintenanceMode: false,
      });

      const response = await request(app)
        .get('/api/v1/foundation/maintenance')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.maintenanceMode).toBe(false);
    });
  });
});
