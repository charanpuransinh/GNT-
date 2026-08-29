import { Router } from 'express';
import { GSTController } from '../controllers/gst.controller';

const router = Router();

router.post('/tax-slabs', GSTController.createTaxSlab);
router.get('/tax-slabs', GSTController.getTaxSlabs);
router.post('/calculate', GSTController.calculateTax);
router.get('/returns/gstr1', GSTController.getGSTR1);
router.get('/returns/gstr3b', GSTController.getGSTR3B);
router.post('/reconcile/gstr2b', GSTController.reconcileGSTR2B);

export default router;
