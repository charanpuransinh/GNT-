import { Router } from 'express';
import { PurchaseController } from '../controllers/purchase.controller';
import { PurchaseOrderController } from '../controllers/purchase-order.controller';

export function createPurchaseRouter(controller: PurchaseController, poController: PurchaseOrderController): Router {
  const router = Router();
  router.get('/invoices', controller.getInvoices);
  router.post('/invoices', controller.createInvoice);
  router.get('/invoices/:id', controller.getInvoiceById);
  router.put('/invoices/:id', controller.updateInvoice);
  router.delete('/invoices/:id', controller.deleteInvoice);
  router.post('/invoices/:id/approve', controller.approveInvoice);
  router.post('/invoices/:id/post', controller.postInvoice);
  router.post('/invoices/:id/cancel', controller.cancelInvoice);
  router.post('/invoices/:id/ocr', controller.uploadOCR);
  router.post('/invoices/ocr/review', controller.reviewOCR);
  router.get('/returns', controller.getReturns);
  router.post('/returns', controller.createReturn);
  router.get('/returns/:id', controller.getReturnById);
  router.post('/returns/:id/approve', controller.approveReturn);
  router.post('/returns/:id/post', controller.postReturn);
  router.get('/orders', poController.list);
  router.post('/orders', poController.create);
  router.get('/orders/:id', poController.get);
  router.put('/orders/:id', poController.update);
  router.post('/orders/:id/send', poController.send);
  router.post('/orders/:id/receive', poController.receive);
  router.post('/orders/:id/cancel', poController.cancel);
  router.post('/orders/:id/convert-to-invoice', poController.convert);
  return router;
}

// हटाया गया (समीक्षक AI, 2026-09-02): `router` इस function के अंदर की चीज़ है, बाहर मौजूद ही नहीं —
// यह line runtime पर ReferenceError देती थी और पूरे app को गिरा देती थी। router पाने के लिए
// `createPurchaseRouter(controller, poController)` बुलाओ (M18 की तरह composition चाहिए)।
