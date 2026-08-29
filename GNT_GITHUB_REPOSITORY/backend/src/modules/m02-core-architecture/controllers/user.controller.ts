import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { logger } from '@/common/logging/logger';

export const userController = {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = (req as any).company?.id;
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
      const { id } = req.params;
      const user = await userService.getUserById(id);
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
      const companyId = (req as any).company?.id;
      const user = await userService.createUser({ ...req.body, companyId });
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
      const { id } = req.params;
      const user = await userService.updateUser(id, req.body);
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
      const { id } = req.params;
      await userService.deleteUser(id);
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
