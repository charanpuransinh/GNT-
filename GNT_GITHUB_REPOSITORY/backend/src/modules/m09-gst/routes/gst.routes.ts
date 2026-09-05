import { Router } from 'express';
import { GSTController } from '../controllers/gst.controller';
import { EInvoiceController } from '../controllers/einvoice.controller';

const router = Router();

router.post('/tax-slabs', GSTController.createTaxSlab);
router.get('/tax-slabs', GSTController.getTaxSlabs);
router.post('/calculate', GSTController.calculateTax);
router.get('/returns/gstr1', GSTController.getGSTR1);
router.get('/returns/gstr3b', GSTController.getGSTR3B);
router.post('/reconcile/gstr2b', GSTController.reconcileGSTR2B);

// पहले ये चारों route कहीं mount ही नहीं थे — पूरा e-invoice/e-way-bill feature
// लिखा हुआ था पर किसी भी request तक पहुँचता ही नहीं था (404 हमेशा)।
router.post('/einvoice/generate', EInvoiceController.generateEInvoice);
router.post('/einvoice/cancel', EInvoiceController.cancelEInvoice);
router.get('/einvoice/:irn/status', EInvoiceController.getEInvoiceStatus);
router.post('/eway-bill/generate', EInvoiceController.generateEWayBill);

export default router;
