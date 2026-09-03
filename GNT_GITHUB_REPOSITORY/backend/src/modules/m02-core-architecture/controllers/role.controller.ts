import { Request, Response, NextFunction } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { roleService } from '../services/role.service';

export const roleController = {
  async listRoles(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const roles = await roleService.listRoles(companyId);
      res.json({
        success: true,
        data: roles,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const role = await roleService.getRoleById(id);
      res.json({
        success: true,
        data: role,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createRole(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const role = await roleService.createRole({ ...req.body, companyId });
      res.status(201).json({
        success: true,
        data: role,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const role = await roleService.updateRole(id, req.body);
      res.json({
        success: true,
        data: role,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteRole(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      await roleService.deleteRole(id);
      res.json({
        success: true,
        data: { deleted: true },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
