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
  {
    load: async () => {
      const [{ default: appRoutes }, { AppEventHandlers }, { eventBus }, { auditLogger }] = await Promise.all([
        import('./modules/m01-foundation/routes/app.routes'),
        import('./modules/m01-foundation/events/app.handlers'),
        import('./common/events/event-bus'),
        import('./common/logging/audit-logger'),
      ]);
      // AppEventHandlers कभी register ही नहीं होता था — HEALTH_DEGRADED/MAINTENANCE_TOGGLED
      // publish होते तो भी कोई सुनने वाला नहीं था (audit_log कभी नहीं बनता)।
      new AppEventHandlers(eventBus, auditLogger).register();
      return appRoutes;
    },
    code: 'M01', path: '/api/v1/foundation', mounted: true,
  },
  { load: async () => (await import('./modules/m02-core-architecture/routes/auth.routes')).default, code: 'M02', path: '/api/v1/auth',          mounted: true },
  {
    load: async () => {
      const { default: deviceRoutes } = await import('./modules/m03-device-platform/routes/device.routes');
      // टास्क #024 — E1: expired sessions की सफाई का job (unref — process नहीं रोकता)
      const { startSessionCleanupJob } = await import('./modules/m03-device-platform/services/session-cleanup');
      startSessionCleanupJob();
      // DeviceEventHandlers कभी register नहीं होता था — DEVICE_REGISTERED/SESSION_TERMINATED
      // कहीं audit_log में नहीं जाते थे।
      const { DeviceEventHandlers } = await import('./modules/m03-device-platform/events/device.handlers');
      const { eventBus } = await import('./common/events/event-bus');
      const { auditLogger } = await import('./common/logging/audit-logger');
      new DeviceEventHandlers(eventBus, auditLogger).register();
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
      // ✅ Stock wiring असली StockService से।
      // ✅ 2026-09-06 (मालिक P0): ledger अब असली M10 InvoiceLedgerService से —
      //    purchase invoice post होते ही Dr Purchases / Dr GST Input / Cr Creditors।
      // ⚠️ GST handler अब logged no-op: उसका ITC ledger हिस्सा InvoiceLedgerService
      //    की GST-Input पंक्ति में हो जाता है; GSTR-2 table update (M09 gst_transaction)
      //    अलग काम है (owner ने अगले sprint में रखा)।
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
        { InvoiceLedgerService },
        { gstService },
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
        import('./modules/m10-accounting'),
        import('./modules/m09-gst'),
      ]);

      const stockSvc = new StockService();
      const invoiceLedgerSvc = new InvoiceLedgerService(prisma);
      const stockServiceForHandlers = {
        async addStock(data: { product_id: string; quantity: number; rate: number; batch_id?: string; reference: string; company_id: string }): Promise<void> {
          await stockSvc.addStock(data.product_id, data.quantity, data.company_id, null, data.batch_id ?? null, data.rate ?? null, 'purchase', data.reference);
        },
        async deductStock(data: { product_id: string; quantity: number; reference: string; company_id: string }): Promise<void> {
          await stockSvc.deductStock(data.product_id, data.quantity, data.company_id, null, null, 'purchase_return', data.reference);
        },
      };
      const gstServiceForHandlers = {
        async calculateInputTax(data: {
          invoice_id: string;
          company_id: string;
          supplier_id: string;
          invoice_date: Date;
          taxable_amount: number;
          total_tax_amount: number;
          items: Array<{ product_id: string; tax_amount: number; hsn_code?: string }>;
        }): Promise<void> {
          // ITC का ledger हिस्सा InvoiceLedgerService.postPurchaseInvoice की GST-Input
          // पंक्ति में हो जाता है; gst_transaction row (GSTR-2/3B के लिए) अब यहाँ से।
          // असली post block नहीं करना — इसलिए throw नहीं, बस error log (M08 वाला pattern)।
          try {
            await gstService.recordInvoiceTax({
              companyId: data.company_id,
              partyId: data.supplier_id,
              referenceType: 'purchase_invoice',
              referenceId: data.invoice_id,
              transactionDate: data.invoice_date,
              hsnCode: data.items.length === 1 ? data.items[0].hsn_code ?? null : null,
              taxableAmount: data.taxable_amount,
              totalTaxAmount: data.total_tax_amount,
              taxType: 'input',
            });
          } catch (e) {
            console.error(`[M07→M09] gst_transaction record failed for invoice ${data.invoice_id}:`, e);
          }
        },
        async reverseInputTax(data: {
          return_id: string; company_id: string; supplier_id: string; return_date: Date;
          taxable_amount: number; total_tax_amount: number;
          items: Array<{ product_id: string; tax_amount: number }>;
        }): Promise<void> {
          try {
            // negative amounts — GSTR-1/3B के sum में असली invoice के ख़िलाफ़ काट देता है
            await gstService.recordInvoiceTax({
              companyId: data.company_id,
              partyId: data.supplier_id,
              referenceType: 'purchase_return',
              referenceId: data.return_id,
              transactionDate: data.return_date,
              taxableAmount: -data.taxable_amount,
              totalTaxAmount: -data.total_tax_amount,
              taxType: 'input',
            });
          } catch (e) {
            console.error(`[M07→M09] gst_transaction reversal failed for return ${data.return_id}:`, e);
          }
        },
      };
      const ledgerServiceForHandlers = {
        async createPurchaseEntry(data: { invoice_id: string; company_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void> {
          const res = await invoiceLedgerSvc.postPurchaseInvoice(data.company_id, data.invoice_id, 'system');
          if (!res.posted && res.reason !== 'already posted to ledger') {
            throw new Error(`M07→M10 purchase ledger posting failed: ${res.reason}`);
          }
        },
        async createPurchaseReturnEntry(data: { return_id: string; company_id: string; supplier_id: string; amount: number; tax_amount: number; reference: string }): Promise<void> {
          const res = await invoiceLedgerSvc.postPurchaseReturn(data.company_id, data.return_id, 'system');
          if (!res.posted && res.reason !== 'already posted to ledger') {
            throw new Error(`M07→M10 purchase-return ledger reversal failed: ${res.reason}`);
          }
        },
      };

      const handlers = new PurchaseEventHandlers(stockServiceForHandlers, gstServiceForHandlers, ledgerServiceForHandlers, eventBus);
      const purchaseService = new PurchaseService(prisma, handlers, eventBus);
      const poService = new PurchaseOrderService(prisma, handlers, eventBus);
      return createPurchaseRouter(new PurchaseController(purchaseService), new PurchaseOrderController(poService));
    } },
  {
    load: async () => {
      // registerSalesEventHandlers कभी बुलाया ही नहीं जाता था — M11 का असली
      // payment.received event कभी M08 तक पहुँचता ही नहीं था, invoice हमेशा
      // 'unpaid' दिखता रहता चाहे payment असल में हो चुका हो (M11 खुद invoice
      // mutate नहीं करता — payment.service.ts का अपना नियम, यही handler चाहिए था)।
      const [{ default: salesRoutes }, { registerSalesEventHandlers }] = await Promise.all([
        import('./modules/m08-sales/routes/sales.routes'),
        import('./modules/m08-sales/events/sales.handlers'),
      ]);
      registerSalesEventHandlers();
      return salesRoutes;
    },
    code: 'M08', path: '/api/v1/sales', mounted: true,
  },
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
  { code: 'M18', path: '/api/v1',  mounted: true,
    load: async () => {
      const [{ createIntegrationRoutes }, { IntegrationController }, { WebhookController },
             { IntegrationService }, { WebhookService }, { IntegrationRepository },
             { GatewayService }, { prisma }, { EventEmitter },
             { PaymentService }, { eventBus: commonEventBus }, { PAYMENT_WEBHOOK_SUCCESS, PAYMENT_WEBHOOK_FAILED }] = await Promise.all([
        import('./modules/m18-external-integration'),
        import('./modules/m18-external-integration/controllers/integration.controller'),
        import('./modules/m18-external-integration/controllers/webhook.controller'),
        import('./modules/m18-external-integration/services/integration.service'),
        import('./modules/m18-external-integration/services/webhook.service'),
        import('./modules/m18-external-integration/repositories/integration.repository'),
        import('./modules/m18-external-integration/services/gateway.service'),
        import('./common/config/prisma'),
        import('node:events'),
        import('./modules/m11-payment/services/payment.service'),
        import('./common/events/event-bus'),
        import('./modules/m18-external-integration/events/integration.events'),
      ]);
      const repo = new IntegrationRepository(prisma);
      const gateway = new GatewayService(repo);
      const bus = new EventEmitter();
      const integrationService = new IntegrationService(repo, gateway, bus);
      const webhookService = new WebhookService(repo, gateway, integrationService, bus);

      // असली wiring: webhook → M11 payment confirm (पहले event emit होता था पर कोई sunta nahi tha)
      const paymentService = new PaymentService(prisma, commonEventBus);
      bus.on(PAYMENT_WEBHOOK_SUCCESS, (event: { order_id: string; payload: Record<string, unknown> }) => {
        paymentService.confirmByProviderRef(event.order_id, event.payload).catch((e: unknown) => {
          console.error('[M18→M11] payment confirm failed:', e);
        });
      });
      bus.on(PAYMENT_WEBHOOK_FAILED, (event: { order_id: string; payload: Record<string, unknown> }) => {
        paymentService.confirmByProviderRef(event.order_id, event.payload).catch((e: unknown) => {
          console.error('[M18→M11] payment fail handler:', e);
        });
      });

      return createIntegrationRoutes(new IntegrationController(integrationService), new WebhookController(webhookService));
    } },
  { code: 'M19', path: '/api/v1/monitoring', mounted: true,
    load: async () => {
      const m19 = await import('./modules/m19-production-monitoring');
      // cross-module: har business event append-only audit_log me
      m19.registerSecurityEventHandlers();
      return m19.securityRoutes;
    } },
  // M21 (Data Sense) हटा दिया — owner फ़ैसला 2026-09-08। उसका पूरा pipeline अब
  // M11 (Payment) के अंदर `data-sense/` sub-module है और M11 router के नीचे
  // `/api/v1/payments/data-sense` पर चढ़ता है (अलग registry entry नहीं)।
  { code: 'M20', path: '/api/v1/trade',         mounted: true,
    load: async () => (await import('./modules/m20-international-trade')).tradeRoutes },
  { code: 'M22', path: '/api/v1/subscriptions', mounted: true,
    load: async () => (await import('./modules/m22-subscription')).subscriptionRoutes },
  // M23 (Security, Governance & Data Protection) — added 2026-09-12/13,
  // M23-M31 mounting pass. Real code + DB tests existed since the earlier
  // 2026-09-12 wiring pass, but was never mounted here — 100% unreachable
  // until now (see CERTIFICATION_LOG.md). Policy-evaluate/CRUD +
  // retention-policy CRUD/execute only; TenantIsolationGuard/
  // AuthorizationService remain a library other modules call directly
  // (M23's own INTEGRATION_NOTES.md), not HTTP endpoints.
  { code: 'M23', path: '/api/v1/security',      mounted: true,
    load: async () => (await import('./modules/m23-security-governance')).securityRoutes },
  // M24 (Performance, Cache & Database Optimization) — added 2026-09-13, M23-M31 mounting pass.
  { code: 'M24', path: '/api/v1/performance',   mounted: true,
    load: async () => (await import('./modules/m24-performance-cache')).performanceRoutes },
  // M28 (Reports & Export) — added 2026-09-13, M23-M31 mounting pass.
  // NOT /api/v1/reports — M17 already owns that path for real. Scheduling
  // (ExportScheduler) is not mounted: no real SchedulerPort exists yet
  // (M13's job-creation isn't public, and M13's scheduled_job model is
  // rule-bound — see reports/../scheduler/export-scheduler.ts header).
  { code: 'M28', path: '/api/v1/reports-export', mounted: true,
    load: async () => (await import('./modules/m28-reports-export')).reportsExportRoutes },
  // M29 (Mobile Auth & Push) — added 2026-09-13, M23-M31 mounting pass.
  // auth/login + auth/refresh are pre-auth — see app.ts PUBLIC_PREFIXES.
  { code: 'M29', path: '/api/v1/mobile',        mounted: true,
    load: async () => (await import('./modules/m29-mobile')).mobileRoutes },
  // M31 (Workforce & HR Intelligence) — added 2026-09-13, M23-M31 mounting pass.
  // M30 (AI/ML Guards & Reliability) intentionally NOT mounted — its only
  // real singletons (retry/timeout/idempotency/ai-data-guard) are code-level
  // utilities other backend code should import directly, not HTTP resources
  // (see CERTIFICATION_LOG.md); wiring retry/idempotency into e.g. M18's
  // payment-gateway calls is real integration work that needs careful,
  // reviewed changes to those call sites, not a rushed overnight route.
  { code: 'M31', path: '/api/v1/workforce',     mounted: true,
    load: async () => (await import('./modules/m31-workforce-intelligence')).workforceRoutes },
  // M26 (Global Search) — added 2026-09-12, M23-M34 wiring pass.
  { code: 'M26', path: '/api/v1/search',        mounted: true,
    load: async () => (await import('./modules/m26-global-search')).searchRoutes },
  // M27 (Analytics, KPI & Dashboard) — added 2026-09-12, M23-M34 wiring pass.
  { code: 'M27', path: '/api/v1/analytics',     mounted: true,
    load: async () => (await import('./modules/m27-analytics-kpi')).analyticsRoutes },
];

export const pendingMounts = (): ReadonlyArray<ModuleMount> => MODULE_MOUNTS.filter((m) => !m.mounted);
