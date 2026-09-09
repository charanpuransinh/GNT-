import { AppError } from '@/common/errors/error-classes';
import { logger } from '@/common/logging/logger';
import { requireTenant, requireUser } from '@/common/middleware/require-tenant';
import { NextFunction, Request, Response } from 'express';
import { deviceService } from '../services/device.service';

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

  async listReleases(req: Request, res: Response, next: NextFunction) {
    try {
      const platform = typeof req.query.platform === 'string' ? req.query.platform : undefined;
      const releases = await deviceService.listReleases(platform);
      res.json({
        success: true,
        data: releases,
        meta: { requestId: res.locals.requestId, timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  },

  async publishRelease(req: Request, res: Response, next: NextFunction) {
    try {
      const b = req.body ?? {};
      const release = await deviceService.publishRelease({
        platform: String(b.platform),
        version: String(b.version),
        releaseNotes: Array.isArray(b.releaseNotes) ? b.releaseNotes.map(String) : [],
        minSupported: b.minSupported ? String(b.minSupported) : null,
        downloadUrl: b.downloadUrl ? String(b.downloadUrl) : null,
        isPublished: b.isPublished !== false,
        createdBy: req.user?.id,
      });
      res.status(201).json({
        success: true,
        data: release,
        meta: { requestId: res.locals.requestId, timestamp: new Date().toISOString() },
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
