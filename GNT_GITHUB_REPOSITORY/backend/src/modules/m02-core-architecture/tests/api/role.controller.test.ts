import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import { roleController } from '../../controllers/role.controller';
import { roleService } from '../../services/role.service';

vi.mock('../../services/role.service');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.locals.requestId = 'test-request-id';
  (req as any).tenant = { companyId: 'company-123' };
  next();
});

app.get('/api/v1/roles', roleController.listRoles);
app.get('/api/v1/roles/:id', roleController.getRole);
app.post('/api/v1/roles', roleController.createRole);
app.put('/api/v1/roles/:id', roleController.updateRole);
app.delete('/api/v1/roles/:id', roleController.deleteRole);

describe.runIf(process.env.TEST_DB === '1')(
'M02 - Role API Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/roles', () => {
    it('should return 200 with the list of roles', async () => {
      vi.mocked(roleService.listRoles).mockResolvedValue([
        { id: 'role-1', name: 'Admin' },
      ] as any);

      const response = await request(app).get('/api/v1/roles').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('GET /api/v1/roles/:id', () => {
    it('should return the role by id', async () => {
      vi.mocked(roleService.getRoleById).mockResolvedValue({ id: 'role-1', name: 'Admin' } as any);

      const response = await request(app).get('/api/v1/roles/role-1').expect(200);

      expect(response.body.data.id).toBe('role-1');
    });
  });

  describe('POST /api/v1/roles', () => {
    it('should create a role and return 201', async () => {
      vi.mocked(roleService.createRole).mockResolvedValue({ id: 'role-2', name: 'Manager' } as any);

      const response = await request(app)
        .post('/api/v1/roles')
        .send({ name: 'Manager' })
        .expect(201);

      expect(response.body.data.name).toBe('Manager');
    });
  });

  describe('PUT /api/v1/roles/:id', () => {
    it('should update the role', async () => {
      vi.mocked(roleService.updateRole).mockResolvedValue({ id: 'role-1', name: 'Updated' } as any);

      const response = await request(app)
        .put('/api/v1/roles/role-1')
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body.data.name).toBe('Updated');
    });
  });

  describe('DELETE /api/v1/roles/:id', () => {
    it('should delete the role', async () => {
      vi.mocked(roleService.deleteRole).mockResolvedValue(undefined as any);

      const response = await request(app).delete('/api/v1/roles/role-1').expect(200);

      expect(response.body.data.deleted).toBe(true);
    });
  });
});
