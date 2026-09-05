/** M21 — routes (M21_API_BASE = /api/v1/data-sense) */
import { Router } from 'express';
import { dataSenseController } from '../controllers/dataSense.controller';

const router = Router();

router.post('/analyze', (req, res, next) => dataSenseController.analyze(req, res, next));
router.post('/transfer', (req, res, next) => dataSenseController.transfer(req, res, next));
router.get('/field-map', (req, res) => dataSenseController.fieldMap(req, res));
router.get('/options', (req, res) => dataSenseController.options(req, res));

export const dataSenseRoutes = router;
export default router;
