// GNT M20 — Trade Routes
// Owner: D4-DELTA

import { Router } from 'express';
import { TradeController } from '../controllers/trade.controller';
import { HSNController } from '../controllers/hsn.controller';
import { CustomsController } from '../controllers/customs.controller';
import { TradeDocumentService } from '../services/trade-document.service';
import { FXService } from '../services/fx.service';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../../../shared/errors/app-error';
import { GenerateDocumentSchema } from '../validators/trade.schema';

const router = Router();
const tradeCtrl = new TradeController();
const hsnCtrl = new HSNController();
const customsCtrl = new CustomsController();
const prisma = new PrismaClient();
const fxService = new FXService(prisma);
const docService = new TradeDocumentService(prisma);

// ── Trade Shipments ──
router.post('/exports', tradeCtrl.createExport);
router.post('/imports', tradeCtrl.createImport);
router.get('/shipments', tradeCtrl.list);
router.get('/shipments/:id', tradeCtrl.getById);
router.patch('/shipments/:id', tradeCtrl.update);
router.delete('/shipments/:id', tradeCtrl.delete);

// ── HSN ──
router.get('/hsn/search', hsnCtrl.search);
router.get('/hsn/:code', hsnCtrl.getByCode);
router.post('/hsn/validate', hsnCtrl.validate);
router.get('/hsn/chapters', hsnCtrl.getChapters);
router.get('/hsn/chapters/:chapter/headings', hsnCtrl.getHeadings);

// ── FX ──
router.get('/fx/rates', async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);
    const base = (req.query.base as string) || 'INR';
    const target = req.query.target as string;
    if (target) {
      const rate = await fxService.getFXRate(companyId, base, target);
      res.status(200).json(rate ? [rate] : []);
    } else {
      const rates = await fxService.getFXRates(companyId, base);
      res.status(200).json(rates);
    }
  } catch (err) {
    next(err);
  }
});

router.post('/fx/convert', async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);
    const { amount, from_currency, to_currency } = req.body;
    const result = await fxService.convertAmount(companyId, amount, from_currency, to_currency);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// ── Customs ──
router.post('/customs/calculate', customsCtrl.calculate);
router.get('/customs/rules', customsCtrl.getRules);

// ── Documents ──
router.post('/documents/generate', async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);
    const parsed = GenerateDocumentSchema.parse(req.body);
    const doc = await docService.generateDocument(companyId, parsed);
    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/documents/:id', async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);
    const doc = await docService.getDocument(req.params.id, companyId);
    if (!doc) throw new AppError('NOT_FOUND', 'Document not found', 404);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/shipments/:tradeJobId/documents', async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);
    const docs = await docService.listDocuments(req.params.tradeJobId, companyId);
    res.status(200).json(docs);
  } catch (err) {
    next(err);
  }
});

router.patch('/documents/:id/status', async (req, res, next) => {
  try {
    const companyId = req.headers['x-company-id'] as string;
    if (!companyId) throw new AppError('UNAUTHORIZED', 'Company ID required', 401);
    const { status } = req.body;
    if (!status) throw new AppError('VALIDATION_ERROR', 'status is required', 400);
    const doc = await docService.updateDocumentStatus(req.params.id, companyId, status);
    res.status(200).json(doc);
  } catch (err) {
    next(err);
  }
});

export default router;
