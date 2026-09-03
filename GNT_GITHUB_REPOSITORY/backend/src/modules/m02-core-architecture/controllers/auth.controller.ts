import { Request, Response, NextFunction } from 'express';
import { requireUser } from '@/common/middleware/require-tenant';
import { authService } from '../services/auth.service';
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';
import { auditLogger } from '@/common/logging/audit-logger';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      auditLogger.log({
        userId: result.user.id,
        action: 'LOGIN',
        module: 'M02',
        resource: 'auth',
        status: 'SUCCESS',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      res.json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      auditLogger.log({
        action: 'LOGIN',
        module: 'M02',
        resource: 'auth',
        status: 'FAILED',
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      next(error);
    }
  },

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOtp(req.body);
      res.json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.headers['x-refresh-token'] as string;
      if (!refreshToken) {
        throw new AppError('GNT-ERR-2001', 'Refresh token required', 401);
      }

      const result = await authService.refreshToken(refreshToken);
      res.json({
        success: true,
        data: result,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      await authService.logout(userId);

      auditLogger.log({
        userId,
        action: 'LOGOUT',
        module: 'M02',
        resource: 'auth',
        status: 'SUCCESS',
        ip: req.ip,
      });

      res.json({
        success: true,
        data: { message: 'Logged out successfully' },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      const user = await authService.getCurrentUser(userId);
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

  async unlockSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      const { pin } = req.body;
      await authService.unlockSession(userId, pin);
      res.json({
        success: true,
        data: { unlocked: true },
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
