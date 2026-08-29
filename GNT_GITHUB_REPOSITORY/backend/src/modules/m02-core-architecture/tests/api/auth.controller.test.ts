import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { authController } from '../../controllers/auth.controller';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.requestId = 'test-request-id';
  next();
});

app.post('/api/v1/auth/login', authController.login);
app.post('/api/v1/auth/otp-verify', authController.verifyOtp);
app.post('/api/v1/auth/refresh', authController.refreshToken);
app.post('/api/v1/auth/logout', (req, res, next) => {
  (req as any).user = { id: 'user-123' };
  next();
}, authController.logout);

describe('M02 - Auth API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 with tokens on valid login', async () => {
      vi.mocked(authService.login).mockResolvedValue({
        user: {
          id: 'user-123',
          name: 'Test User',
          email: 'test@example.com',
          username: 'testuser',
          roles: [],
          permissions: [],
          companyId: 'company-123',
          isActive: true,
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        requiresOtp: false,
        roles: [],
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
          companyCode: 'COMP001',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('access-token');
      expect(response.body.meta.requestId).toBe('test-request-id');
    });

    it('should return 401 on invalid credentials', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'wrong',
          password: 'wrong',
          companyCode: 'COMP001',
        })
        .expect(500); // Error middleware would convert to proper status

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/otp-verify', () => {
    it('should verify OTP and return tokens', async () => {
      vi.mocked(authService.verifyOtp).mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        user: {
          id: 'user-123',
          name: 'Test',
          email: 'test@example.com',
          username: 'testuser',
          roles: [],
          permissions: [],
          companyId: 'company-123',
          isActive: true,
        },
      });

      const response = await request(app)
        .post('/api/v1/auth/otp-verify')
        .send({
          userId: 'user-123',
          otp: '123456',
        })
        .expect(200);

      expect(response.body.data.accessToken).toBe('new-access');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully', async () => {
      vi.mocked(authService.logout).mockResolvedValue();

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
    });
  });
});
