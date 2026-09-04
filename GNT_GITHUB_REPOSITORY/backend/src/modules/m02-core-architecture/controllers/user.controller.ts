import { Request, Response, NextFunction } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { userService } from '../services/user.service';
import { logger } from '@/common/logging/logger';

export const userController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const users = await userService.listUsers(companyId);
      res.json({
        success: true,
        data: users,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId;
      const user = await userService.getUserById(id, companyId);
      res.json({
        success: true,
        data: user,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const user = await userService.createUser(req.body, companyId);
      res.status(201).json({
        success: true,
        data: user,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId;
      const user = await userService.updateUser(id, companyId, req.body);
      res.json({
        success: true,
        data: user,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const companyId = requireTenant(req).companyId;
      await userService.deleteUser(id, companyId);
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
