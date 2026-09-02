/**
 * M17 Reporting — Report Endpoints
 * Owner: D4-DELTA
 */
import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { ReportService } from '../services/report.service';
import { ReportRepository } from '../repositories/report.repository';
import { prisma } from '@/common/config/prisma';

// Cross-module adapters — public contract से डेटा, M17 अपने आकार में ढालता है
// (टास्क #012 का फैसला: M17 ← M06/M07/.../M12, adapter M17 के अंदर)
import { InventoryAdapter } from '../services/adapters/inventory.adapter';
import { PurchaseAdapter } from '../services/adapters/purchase.adapter';
import { SalesAdapter } from '../services/adapters/sales.adapter';
import { GSTAdapter } from '../services/adapters/gst.adapter';
import { AccountingAdapter } from '../services/adapters/accounting.adapter';
import { HRAdapter } from '../services/adapters/hr.adapter';

const router = Router();

// साझा prisma (अलग connection pool नहीं खोलना)
const reportRepository = new ReportRepository(prisma);

const reportService = new ReportService(
  reportRepository,
  new InventoryAdapter(),
  new PurchaseAdapter(),
  new SalesAdapter(),
  new GSTAdapter(),
  new AccountingAdapter(),
  new HRAdapter(),
  process.env.EXPORT_DIR || '/tmp/exports'
);

const controller = new ReportController(reportService);

// ─── Report Generation Routes ───
router.post('/generate', controller.generateReport);
router.get('/sales', controller.getSalesReport);
router.get('/purchase', controller.getPurchaseReport);
router.get('/inventory', controller.getInventoryReport);
router.get('/gst', controller.getGSTReport);
router.get('/accounting', controller.getAccountingReport);
router.get('/hr', controller.getHRReport);
router.post('/export', controller.exportReport);
router.get('/executive', controller.getExecutiveDashboard);

// ─── Report Config Routes ───
router.post('/configs', controller.createConfig);
router.get('/configs', controller.getConfigs);
router.put('/configs/:id', controller.updateConfig);
router.delete('/configs/:id', controller.deleteConfig);

// ─── Report Template Routes ───
router.post('/templates', controller.createTemplate);
router.get('/templates', controller.getTemplates);
router.put('/templates/:id', controller.updateTemplate);
router.delete('/templates/:id', controller.deleteTemplate);

export default router;
