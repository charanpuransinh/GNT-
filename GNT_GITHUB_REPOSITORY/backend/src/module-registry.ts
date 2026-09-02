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
  { load: async () => (await import('./modules/m01-foundation/routes/app.routes')).default, code: 'M01', path: '/api/v1/app',           mounted: true },
  { load: async () => (await import('./modules/m02-core-architecture/routes/auth.routes')).default, code: 'M02', path: '/api/v1/auth',          mounted: true },
  { load: async () => (await import('./modules/m03-device-platform/routes/device.routes')).default, code: 'M03', path: '/api/v1/device',        mounted: true },
  { load: async () => (await import('./modules/m04-company-management/routes/company.routes')).default, code: 'M04', path: '/api/v1/company',       mounted: true },
  { code: 'M05', path: '/api/v1/parties',       mounted: false, blockedBy: 'टास्क #007 — module पूरी तरह खाली है (AUDIT-01 F3)' },
  { code: 'M06', path: '/api/v1/inventory',     mounted: false, blockedBy: 'tsc errors बाक़ी; frontend इसी path को बुलाता है (AUDIT-01 F11)' },
  { code: 'M07', path: '/api/v1/purchase',      mounted: false, blockedBy: 'createPurchaseRouter(controller, poController) की composition चाहिए — routes फाइल में default export टूटा था (हटाया गया)' },
  { load: async () => (await import('./modules/m08-sales/routes/sales.routes')).default, code: 'M08', path: '/api/v1/sales',         mounted: true },
  { code: 'M09', path: '/api/v1/gst',           mounted: false, blockedBy: 'tsc errors बाक़ी' },
  { code: 'M10', path: '/api/v1/accounting',    mounted: false, blockedBy: 'tsc errors बाक़ी' },
  { load: async () => (await import('./modules/m11-payment/routes')).default, code: 'M11', path: '/api/v1/payments',      mounted: true },
  { load: async () => (await import('./modules/m12-hr')).default, code: 'M12', path: '/api/v1/hr',            mounted: true },
  { load: async () => (await import('./modules/m13-automation')).initM13Module(), code: 'M13', path: '/api/v1/automation',    mounted: true },
  { code: 'M14', path: '/api/v1/imports',       mounted: false, blockedBy: 'index से जो मिलता है वो express router नहीं है (runtime: argument handler must be a function)' },
  { load: async () => (await import('./modules/m15-sync')).default, code: 'M15', path: '/api/v1/sync',          mounted: true },
  { code: 'M16', path: '/api/v1/notifications', mounted: true,
    load: async () => (await import('./modules/m16-notification')).notificationRoutes },
  { code: 'M17', path: '/api/v1/reports',       mounted: false, blockedBy: 'टास्क #012 — 2 tables गायब + सीमा-उल्लंघन (AUDIT-02 File 12)' },
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
  { code: 'M20', path: '/api/v1/trade',         mounted: false, blockedBy: 'टास्क #015 — tables + duty गणना (AUDIT-02 File 15)' },
];

export const pendingMounts = (): ReadonlyArray<ModuleMount> => MODULE_MOUNTS.filter((m) => !m.mounted);
