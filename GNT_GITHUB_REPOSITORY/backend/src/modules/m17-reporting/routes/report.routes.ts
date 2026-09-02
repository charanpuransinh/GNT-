/**
 * M17 Reporting — Report Endpoints
 * Owner: D4-DELTA
 */
import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';
import { ReportRepository } from '../repositories/report.repository';
import { PrismaClient } from '@prisma/client';

// Import cross-module services (READ ONLY access) — public contract (index.ts) से ही
// These are injected into ReportService via the query builder
import { InventoryService } from '@/modules/m06-inventory';
import { PurchaseService } from '@/modules/m07-purchase';
import { SalesService } from '@/modules/m08-sales';
import { GSTService } from '@/modules/m09-gst';
import { AccountingService } from '@/modules/m10-accounting';
import { HRService } from '@/modules/m12-hr';

const router = Router();
const prisma = new PrismaClient();

// Initialize repository and services
const reportRepository = new ReportRepository(prisma);

// Cross-module service instances (injected for READ ONLY operations)
const inventoryService = new InventoryService();
const purchaseService = new PurchaseService();
const salesService = new SalesService();
const gstService = new GSTService();
const accountingService = new AccountingService();
const hrService = new HRService();

const reportService = new ReportService(
  reportRepository,
  inventoryService,
  purchaseService,
  salesService,
  gstService,
  accountingService,
  hrService,
  process.env.EXPORT_DIR || '/tmp/exports'
);

const controller = new ReportController(reportService);

// ─── Report Generation Routes ───
router.post('/reports/generate', controller.generateReport);
router.get('/reports/sales', controller.getSalesReport);
router.get('/reports/purchase', controller.getPurchaseReport);
router.get('/reports/inventory', controller.getInventoryReport);
router.get('/reports/gst', controller.getGSTReport);
router.get('/reports/accounting', controller.getAccountingReport);
router.get('/reports/hr', controller.getHRReport);
router.post('/reports/export', controller.exportReport);
router.get('/reports/executive', controller.getExecutiveDashboard);

// ─── Report Config Routes ───
router.post('/reports/configs', controller.createConfig);
router.get('/reports/configs', controller.getConfigs);
router.put('/reports/configs/:id', controller.updateConfig);
router.delete('/reports/configs/:id', controller.deleteConfig);

// ─── Report Template Routes ───
router.post('/reports/templates', controller.createTemplate);
router.get('/reports/templates', controller.getTemplates);
router.put('/reports/templates/:id', controller.updateTemplate);
router.delete('/reports/templates/:id', controller.deleteTemplate);

export default router;
