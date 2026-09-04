/**
 * GNT — Module mount registry (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 *
 * क्यों बना: AUDIT-01 की F2 — 20 में से 8 modules `app.ts` में mount ही नहीं थे,
 * यानी उनका पूरा लिखा हुआ कोड कभी किसी request तक नहीं पहुँचता।
 *
 * यहाँ एक ही जगह लिखा है कि कौन सा module किस path पर चढ़ना है और अभी उसकी हालत क्या है।
 * **नियम:** जैसे ही किसी module का task पूरा हो (tables जुड़ें + errors 0 हों),
 * उसकी line `mounted: false` से `true` कर दो — mount अपने आप हो जाएगा।
 * किसी module को mount करने से पहले उसका tsc 0 होना चाहिए, वरना app चलते वक़्त गिरेगा।
 */

import type { RequestHandler, Router } from 'express';

export interface ModuleMount {
  /** M01…M20 */
  code: string;
  /** URL का हिस्सा — frontend इसी path को बुलाता है */
  path: string;
  /** अभी app.ts में चढ़ा है या नहीं */
  mounted: boolean;
  /** न चढ़ा हो तो वजह — और कौन सा task उसे खोलेगा */
  blockedBy?: string;
  /** router कैसे लाना है — dynamic import, ताकि एक module टूटे तो बाक़ी app चलता रहे */
  load?: () => Promise<Router | RequestHandler>;
}

export const MODULE_MOUNTS: ReadonlyArray<ModuleMount> = [
  // 2026-09-04: पता `/api/v1/app` से `/api/v1/foundation` किया।
  // backend यहाँ `/api/v1/app` पर सुनता था, जबकि frontend `/api/v1/foundation` बुलाता है —
  // यानी M01 की हर frontend call 404 हो रही थी। न tsc यह पकड़ता है (दोनों सिर्फ़ string हैं),
  // न backend tests (वे router को सीधे बुलाते हैं, mount पते से नहीं जाते)।
  // फ़ैसला contract से: api-contracts/v1/M01-foundation.contract.yaml —
  // servers: /api/v1 + paths: /foundation/... — यानी frontend सही था, mount ग़लत।
  { load: async () => (await import('./modules/m01-foundation/routes/app.routes')).default, code: 'M01', path: '/api/v1/foundation',    mounted: true },
  { load: async () => (await import('./modules/m02-core-architecture/routes/auth.routes')).default, code: 'M02', path: '/api/v1/auth',          mounted: true },
  {
    load: async () => {
      const { default: deviceRoutes } = await import('./modules/m03-device-platform/routes/device.routes');
      // टास्क #024 — E1: expired sessions की सफाई का job (unref — process नहीं रोकता)
      const { startSessionCleanupJob } = await import('./modules/m03-device-platform/services/session-cleanup');
      startSessionCleanupJob();
      return deviceRoutes;
    },
    code: 'M03', path: '/api/v1/device',        mounted: true,
  },
  { load: async () => (await import('./modules/m04-company-management/routes/company.routes')).default, code: 'M04', path: '/api/v1/company',       mounted: true },
  { code: 'M05', path: '/api/v1/parties', mounted: true,
    load: async () => (await import('./modules/m05-party-management')).partyRoutes },
  { code: 'M06', path: '/api/v1/inventory', mounted: true,
    load: async () => (await import('./modules/m06-inventory')).inventoryRoutes },
  { code: 'M07', path: '/api/v1/purchase', mounted: true,
    load: async () => {
      // टास्क #016 — M07 की composition (M18 के load() वाला तरीक़ा)
      // ✅ Stock wiring अब असली StockService से जुड़ी है (अनुवर्ती)।
      // ⚠️ दर्ज: GST + ledger की असली wiring बाक़ी — वहाँ डिज़ाइन-फ़ैसले चाहिए
      // (ledger की डबल-एंट्री रचना + purchase account का चुनाव + GST में state का स्रोत);
      // तब तक वे ज़ोर से fail करते हैं — चुपचाप ग़लत डेटा कभी नहीं।
      const [
        { PurchaseController },
        { PurchaseOrderController },
        { PurchaseService },
        { PurchaseOrderService },
        { PurchaseEventHandlers },
        { prisma },
        { eventBus },
        { createPurchaseRouter },
        { StockService },
      ] = await Promise.all([
        import('./modules/m07-purchase/controllers/purchase.controller'),
        import('./modules/m07-purchase/controllers/purchase-order.controller'),
        import('./modules/m07-purchase/services/purchase.service'),
        import('./modules/m07-purchase/services/po.service'),
        import('./modules/m07-purchase/events/purchase.handlers'),
        import('./common/config/prisma'),
        import('./common/events/event-bus'),
        import('./modules/m07-purchase/routes/purchase.routes'),
        import('./modules/m06-inventory/services/stock.service'),
      ]);

      const stockSvc = new StockService();
      const stockServiceForHandlers = {
        async addStock(data: { product_id: string; quantity: number; rate: number; batch_id?: string; reference: string; company_id: string }): Promise<void> {
          await stockSvc.addStock(data.product_id, data.quantity, data.company_id, null, data.batch_id ?? null, data.rate ?? null, 'purchase', data.reference);
        },
        async deductStock(data: { product_id: string; quantity: number; reference: string; company_id: string }): Promise<void> {
          await stockSvc.deductStock(data.product_id, data.quantity, data.company_id, null, null, 'purchase_return', data.reference);
        },
      };
      const gstServiceForHandlers = {
        async calculateInputTax(data: { invoice_id: string; company_id: string; items: Array<{ product_id: string; tax_amount: number; hsn_code?: string }> }): Promise<void> {
          void data;
          throw new Error('M07→M09 GST wiring अभी बाक़ी है — डिज़ाइन फ़ैसले समीक्षक AI के (state का स्रोत: party.state_code/company GSTIN); notify किया गया है');
        },
        async reverseInputTax(data: { return_id: string; company_id: string; items: Array<{ product_id: string; tax_amount: number }> }): Promise<void> {
          void data;
          throw new Error('M07→M09 GST wiring अभी बाक़ी है (ऊपर वाला नोट)');
        },
      };
      const ledgerServiceForHandlers = {
        async createPurchaseEntry(data: { invoice_id: string; company_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void> {
          void data;
          throw new Error('M07→M10 ledger wiring अभी बाक़ी है — डिज़ाइन फ़ैसले समीक्षक AI के (डबल-एंट्री रचना + purchase account); notify किया गया है');
        },
        async createPurchaseReturnEntry(data: { return_id: string; company_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void> {
          void data;
          throw new Error('M07→M10 ledger wiring अभी बाक़ी है (ऊपर वाला नोट)');
        },
      };

      const handlers = new PurchaseEventHandlers(stockServiceForHandlers, gstServiceForHandlers, ledgerServiceForHandlers, eventBus);
      const purchaseService = new PurchaseService(prisma, handlers, eventBus);
      const poService = new PurchaseOrderService(prisma, handlers, eventBus);
      return createPurchaseRouter(new PurchaseController(purchaseService), new PurchaseOrderController(poService));
    } },
  { load: async () => (await import('./modules/m08-sales/routes/sales.routes')).default, code: 'M08', path: '/api/v1/sales',         mounted: true },
  // 2026-09-04: M09 चालू किया गया। जिस वजह से यह बंद था — "tax_rate_master में
  // cess_rate गायब" — वो commit 4fb2bb6 में ठीक हो चुकी थी (schema में
  // `cess_rate Decimal? @default(0)` मौजूद है, जाँच लिया), पर mount वापस चालू
  // करना रह गया। यानी GST का पूरा module app में चढ़ता ही नहीं था और उसका हर
  // पता 404 देता था — tests भी यह नहीं पकड़ पाए क्योंकि वे router को सीधे बुलाते थे,
  // असली app से होकर नहीं जाते थे।
  { load: async () => (await import('./modules/m09-gst/routes/gst.routes')).default, code: 'M09', path: '/api/v1/gst',           mounted: true },
  { code: 'M10', path: '/api/v1/accounting', mounted: true,
    load: async () => (await import('./modules/m10-accounting')).accountingRoutes },
  { load: async () => (await import('./modules/m11-payment/routes')).default, code: 'M11', path: '/api/v1/payments',      mounted: true },
  { load: async () => (await import('./modules/m12-hr')).default, code: 'M12', path: '/api/v1/hr',            mounted: true },
  { load: async () => (await import('./modules/m13-automation')).initM13Module(), code: 'M13', path: '/api/v1/automation',    mounted: true },
  { load: async () => (await import('./modules/m14-import-export/routes')).default, code: 'M14', path: '/api/v1/imports',       mounted: true },
  { load: async () => (await import('./modules/m15-sync')).default, code: 'M15', path: '/api/v1/sync',          mounted: true },
  { code: 'M16', path: '/api/v1/notifications', mounted: true,
    load: async () => (await import('./modules/m16-notification')).notificationRoutes },
  { code: 'M17', path: '/api/v1/reports',       mounted: true,
    load: async () => (await import('./modules/m17-reporting')).reportRoutes },
  { code: 'M18', path: '/api/v1/integrations',  mounted: true,
    load: async () => {
      const [{ createIntegrationRoutes }, { IntegrationController }, { WebhookController },
             { IntegrationService }, { WebhookService }, { IntegrationRepository },
             { GatewayService }, { prisma }, { EventEmitter }] = await Promise.all([
        import('./modules/m18-external-integration'),
        import('./modules/m18-external-integration/controllers/integration.controller'),
        import('./modules/m18-external-integration/controllers/webhook.controller'),
        import('./modules/m18-external-integration/services/integration.service'),
        import('./modules/m18-external-integration/services/webhook.service'),
        import('./modules/m18-external-integration/repositories/integration.repository'),
        import('./modules/m18-external-integration/services/gateway.service'),
        import('./common/config/prisma'),
        import('node:events'),
      ]);
      const repo = new IntegrationRepository(prisma);
      const gateway = new GatewayService(repo);
      const bus = new EventEmitter();
      const integrationService = new IntegrationService(repo, gateway, bus);
      const webhookService = new WebhookService(repo, gateway, integrationService, bus);
      return createIntegrationRoutes(new IntegrationController(integrationService), new WebhookController(webhookService));
    } },
  { code: 'M19', path: '/api/v1/monitoring', mounted: true,
    load: async () => (await import('./modules/m19-production-monitoring')).securityRoutes },
  // M21 — SENSE/MAP/VALIDATE/PREVIEW चालू (Claude, 2026-09-03)। TRANSFER अभी बाक़ी:
  // owner के 3 फ़ैसले चाहिए (tips/reviewer-ai/SPEC-REVIEW-M20-M21.md)।
  { code: 'M21', path: '/api/v1/data-sense', mounted: true,
    load: async () => (await import('./modules/m21-data-sense')).dataSenseRoutes },
  { code: 'M20', path: '/api/v1/trade',         mounted: true,
    load: async () => (await import('./modules/m20-international-trade')).tradeRoutes },
];

export const pendingMounts = (): ReadonlyArray<ModuleMount> => MODULE_MOUNTS.filter((m) => !m.mounted);
