import { Request, Response, NextFunction } from 'express';
import { appService } from '../services/app.service';
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';

export const appController = {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await appService.getAppConfig();
      res.json({
        success: true,
        data: config,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Failed to get app config', { error, requestId: res.locals.requestId });
      next(error);
    }
  },

  async getHealth(req: Request, res: Response, next: NextFunction) {
    try {
      const health = await appService.getHealthStatus();
      const statusCode = health.status === 'down' ? 503 : health.status === 'degraded' ? 200 : 200;
      res.status(statusCode).json({
        success: true,
        data: health,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Health check failed', { error, requestId: res.locals.requestId });
      next(error);
    }
  },

  async getSystemInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const info = await appService.getSystemInfo();
      res.json({
        success: true,
        data: info,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async checkMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const status = await appService.checkMaintenanceMode();
      res.json({
        success: true,
        data: status,
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
