import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { userController } from '../../controllers/user.controller';
import { userService } from '../../services/user.service';

vi.mock('../../services/user.service');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.requestId = 'test-request-id';
  (req as any).company = { id: 'company-123' };
  next();
});

app.get('/api/v1/users', userController.listUsers);
app.get('/api/v1/users/:id', userController.getUser);
app.post('/api/v1/users', userController.createUser);
app.put('/api/v1/users/:id', userController.updateUser);
app.delete('/api/v1/users/:id', userController.deleteUser);

describe.runIf(process.env.TEST_DB === '1')(
'M02 - User API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/users', () => {
    it('should return 200 with the list of users', async () => {
      vi.mocked(userService.listUsers).mockResolvedValue([
        { id: 'user-1', username: 'testuser' },
      ] as any);

      const response = await request(app).get('/api/v1/users').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/users/:id', () => {
    it('should return the user by id', async () => {
      vi.mocked(userService.getUserById).mockResolvedValue({ id: 'user-1', username: 'testuser' } as any);

      const response = await request(app).get('/api/v1/users/user-1').expect(200);

      expect(response.body.data.id).toBe('user-1');
    });
  });

  describe('POST /api/v1/users', () => {
    it('should create a user and return 201', async () => {
      vi.mocked(userService.createUser).mockResolvedValue({ id: 'user-2', username: 'newuser' } as any);

      const response = await request(app)
        .post('/api/v1/users')
        .send({ username: 'newuser', password: 'pass123' })
        .expect(201);

      expect(response.body.data.username).toBe('newuser');
    });
  });

  describe('PUT /api/v1/users/:id', () => {
    it('should update the user', async () => {
      vi.mocked(userService.updateUser).mockResolvedValue({ id: 'user-1', name: 'Updated' } as any);

      const response = await request(app)
        .put('/api/v1/users/user-1')
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    it('should deactivate (soft-delete) the user', async () => {
      vi.mocked(userService.deleteUser).mockResolvedValue(undefined as any);

      const response = await request(app).delete('/api/v1/users/user-1').expect(200);

      expect(response.body.data.deleted).toBe(true);
    });
  });
});
