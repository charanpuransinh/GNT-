import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { SecurityController } from '../controllers/security.controller';
import { HealthController } from '../controllers/health.controller';
import { AuditService } from '../services/audit.service';
import { SecurityInternal } from '../services/security.internal';
import { HealthService } from '../services/health.service';
import { AuditRepository } from '../repositories/audit.repository';
import { SecurityRepository } from '../repositories/security.repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const auditRepo = new AuditRepository(prisma);
const securityRepo = new SecurityRepository(prisma);
const auditService = new AuditService(auditRepo);
const securityInternal = new SecurityInternal(securityRepo, auditRepo);
const healthService = new HealthService(prisma);

const auditController = new AuditController(auditService);
const securityController = new SecurityController(securityInternal);
const healthController = new HealthController(healthService);

const router = Router();

router.get('/audit/logs', (req, res) => auditController.getAuditLogs(req, res));
router.get('/audit/login-history', (req, res) => auditController.getLoginHistory(req, res));
router.get('/audit/permission-changes', (req, res) => auditController.getPermissionChanges(req, res));
router.get('/security/events', (req, res) => securityController.getSecurityEvents(req, res));
router.post('/security/anomaly-check', (req, res) => securityController.triggerAnomalyCheck(req, res));
router.post('/security/events/:eventId/resolve', (req, res) => securityController.resolveEvent(req, res));
router.get('/health/system', (req, res) => healthController.getSystemHealth(req, res));
router.get('/health/database', (req, res) => healthController.getDatabaseHealth(req, res));
router.get('/health/services', (req, res) => healthController.getServicesHealth(req, res));

export { router as securityRoutes };
