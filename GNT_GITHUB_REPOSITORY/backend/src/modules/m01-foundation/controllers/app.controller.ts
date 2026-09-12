import { Request, Response, NextFunction } from 'express';
import { appService } from '../services/app.service';
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';
import { getConfigQuerySchema } from '../validators/app.schema';

export const appController = {
  async getConfig(req: Request, res: Response, next: NextFunction) {
    try {
      // बनाया गया था पर कहीं इस्तेमाल नहीं होता था — कोई भी अनजान query param
      // चुपचाप स्वीकार हो जाता था, `.strict()` का कोई असर नहीं था।
      const parsed = getConfigQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Unexpected query parameters', 400);
      }
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
