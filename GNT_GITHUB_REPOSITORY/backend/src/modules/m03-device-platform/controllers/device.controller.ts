import { Request, Response, NextFunction } from 'express';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { deviceService } from '../services/device.service';
import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';

export const deviceController = {
  async getActiveSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      const sessions = await deviceService.getActiveSessions(userId);
      res.json({
        success: true,
        data: sessions,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async terminateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      const sessionId = String(req.params.sessionId);
      await deviceService.terminateSession(userId, sessionId);
      res.json({
        success: true,
        data: { terminated: true },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async terminateAllSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      // sessionId कहीं set नहीं होता (route /sessions — सब ख़त्म) — undefined ही जाता है
      const currentSessionId = undefined;
      await deviceService.terminateAllSessions(userId, currentSessionId);
      res.json({
        success: true,
        data: { terminatedAll: true },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async registerDevice(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      const device = await deviceService.registerDevice(userId, req.body);
      res.status(201).json({
        success: true,
        data: device,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getRegisteredDevices(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = requireUser(req).id;
      const devices = await deviceService.getRegisteredDevices(userId);
      res.json({
        success: true,
        data: devices,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async checkForUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const platform = req.query.platform as string;
      const currentVersion = req.query.version as string;
      const updateInfo = await deviceService.checkForUpdate(platform, currentVersion);
      res.json({
        success: true,
        data: updateInfo,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async downloadUpdate(req: Request, res: Response, next: NextFunction) {
    try {
      const { version } = req.body;
      const downloadUrl = await deviceService.getDownloadUrl(version);
      res.json({
        success: true,
        data: { downloadUrl },
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async getDeploymentSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const settings = await deviceService.getDeploymentSettings(companyId);
      res.json({
        success: true,
        data: settings,
        meta: {
          requestId: res.locals.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateDeploymentSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = requireTenant(req).companyId;
      const settings = await deviceService.updateDeploymentSettings(companyId, req.body);
      res.json({
        success: true,
        data: settings,
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
