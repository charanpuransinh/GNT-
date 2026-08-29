import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { deviceController } from '../../controllers/device.controller';
import { deviceService } from '../../services/device.service';

vi.mock('../../services/device.service');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.requestId = 'test-request-id';
  (req as any).user = { id: 'user-123' };
  (req as any).company = { id: 'company-123' };
  next();
});

app.get('/api/v1/device/sessions', deviceController.getActiveSessions);
app.delete('/api/v1/device/sessions/:sessionId', deviceController.terminateSession);
app.get('/api/v1/device/update-check', deviceController.checkForUpdate);

describe('M03 - Device API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/device/sessions', () => {
    it('should return active sessions', async () => {
      vi.mocked(deviceService.getActiveSessions).mockResolvedValue([
        {
          id: 'session-1',
          deviceName: 'iPhone 15',
          platform: 'ios',
          status: 'active',
          createdAt: new Date(),
          lastActiveAt: new Date(),
          expiresAt: new Date(),
        },
      ] as any);

      const response = await request(app)
        .get('/api/v1/device/sessions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta.requestId).toBe('test-request-id');
    });
  });

  describe('DELETE /api/v1/device/sessions/:sessionId', () => {
    it('should terminate session', async () => {
      vi.mocked(deviceService.terminateSession).mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/device/sessions/session-1')
        .expect(200);

      expect(response.body.data.terminated).toBe(true);
    });
  });

  describe('GET /api/v1/device/update-check', () => {
    it('should return update info', async () => {
      vi.mocked(deviceService.checkForUpdate).mockResolvedValue({
        currentVersion: '2.0.0',
        latestVersion: '2.1.0',
        hasUpdate: true,
        severity: 'major',
        forceUpdate: false,
      });

      const response = await request(app)
        .get('/api/v1/device/update-check?platform=ios&version=2.0.0')
        .expect(200);

      expect(response.body.data.hasUpdate).toBe(true);
    });
  });
});
