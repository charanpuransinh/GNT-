/** Data Sense — routes (mounted under M11 at /api/v1/payments/data-sense) */
import { Router } from 'express';
import { dataSenseController } from '../controllers/dataSense.controller';

const router = Router();

router.post('/analyze', (req, res, next) => dataSenseController.analyze(req, res, next));
router.post('/transfer', (req, res, next) => dataSenseController.transfer(req, res, next));
router.get('/field-map', (req, res) => dataSenseController.fieldMap(req, res));
router.get('/options', (req, res) => dataSenseController.options(req, res));

// on-hold सूची — जो बैंक-receipt अपने-आप apply नहीं हुईं (owner खुद resolve करे)
router.get('/on-hold', (req, res, next) => dataSenseController.onHoldList(req, res, next));
router.post('/on-hold/:id/resolve', (req, res, next) =>
  dataSenseController.onHoldResolve(req, res, next)
);

export const dataSenseRoutes = router;
export default router;
