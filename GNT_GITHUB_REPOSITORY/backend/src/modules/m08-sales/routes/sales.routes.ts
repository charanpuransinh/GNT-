/**
 * M08 SALES & BILLING — Express Routes
 * Module: m08-sales | Team: B4-BRAVO
 * Base: /api/v1/sales
 */

import { Router } from 'express';
import { requireTenant } from '@/common/middleware/require-tenant';
import { salesController } from '../controllers/sales.controller';
import { quotationController } from '../controllers/quotation.controller';
import { returnController } from '../controllers/return.controller';

const router = Router();

// ─── SALES INVOICE ───
router.post('/invoices', salesController.createInvoice.bind(salesController));
router.get('/invoices', salesController.getInvoices.bind(salesController));
router.get('/invoices/:id', salesController.getInvoiceById.bind(salesController));
router.put('/invoices/:id', salesController.updateInvoice.bind(salesController));
router.delete('/invoices/:id', salesController.deleteInvoice.bind(salesController));
router.post('/invoices/:id/approve', salesController.approveInvoice.bind(salesController));
router.post('/invoices/:id/post', salesController.postInvoice.bind(salesController));
router.post('/invoices/:id/print', salesController.generatePrint.bind(salesController));
router.post('/invoices/:id/share', salesController.shareInvoice.bind(salesController));
router.post('/invoices/:id/payment', salesController.recordPayment.bind(salesController));

// ─── QUOTATION ───
router.post('/quotations', quotationController.createQuotation.bind(quotationController));
router.get('/quotations', quotationController.getQuotations.bind(quotationController));
router.get('/quotations/:id', quotationController.getQuotationById.bind(quotationController));
router.put('/quotations/:id', quotationController.updateQuotation.bind(quotationController));
router.post('/quotations/:id/send', quotationController.sendQuotation.bind(quotationController));
router.post('/quotations/:id/convert', quotationController.convertQuotationToOrder.bind(quotationController));
router.delete('/quotations/:id', quotationController.deleteQuotation.bind(quotationController));

// ─── SALES ORDER ───
// Order routes are handled via quotation conversion + order controller extension
// For completeness, order-specific endpoints:
router.post('/orders/:id/convert', salesController.convertOrderToInvoice.bind(salesController));

// ─── SALES RETURN ───
router.post('/returns', returnController.createReturn.bind(returnController));
router.get('/returns', returnController.getReturns.bind(returnController));
router.get('/returns/:id', returnController.getReturnById.bind(returnController));
router.post('/returns/:id/approve', returnController.approveReturn.bind(returnController));
router.post('/returns/:id/post', returnController.postReturn.bind(returnController));

// ─── DELIVERY CHALLAN ───
// Challan endpoints (lightweight controller inline)
router.post('/challans', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { companyId, salesOrderId, customerId, challanDate, notes, items } = req.body;
    const count = await prisma.deliveryChallan.count({ where: { companyId } });
    const date = new Date();
    const yy = date.getFullYear().toString().slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const challanNumber = `CHL-${yy}${mm}-${String(count + 1).padStart(5, '0')}`;
    const totalQuantity = items.reduce((sum: number, i: any) => sum + Number(i.quantity), 0);
    const challan = await prisma.deliveryChallan.create({
      data: {
        companyId,
        salesOrderId,
        customerId,
        challanNumber,
        challanDate: new Date(challanDate),
        status: 'draft',
        totalQuantity,
        notes: notes || null,
        items: { createMany: { data: items.map((i: any) => ({ productId: i.productId, quantity: Number(i.quantity) })) } },
      },
      include: { items: true },
    });
    res.status(201).json({ success: true, data: challan });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/challans', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const companyId = requireTenant(req).companyId as string;
    const { salesOrderId, status, page = '1', limit = '20' } = req.query;
    const where: any = { companyId };
    if (salesOrderId) where.salesOrderId = salesOrderId as string;
    if (status) where.status = status as string;
    const [data, total] = await Promise.all([
      prisma.deliveryChallan.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
      prisma.deliveryChallan.count({ where }),
    ]);
    res.status(200).json({ success: true, data, meta: { total, page: Number(page), limit: Number(limit) } });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/challans/:id', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const { id } = req.params;
    const companyId = requireTenant(req).companyId as string;
    const challan = await prisma.deliveryChallan.findFirst({
      where: { id, companyId },
      include: { items: true, salesOrder: true },
    });
    if (!challan) {
      res.status(404).json({ success: false, error: 'Challan not found' });
      return;
    }
    res.status(200).json({ success: true, data: challan });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
