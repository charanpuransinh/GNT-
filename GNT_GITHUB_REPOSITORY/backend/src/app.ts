/**
 * GNT — App shell (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 *
 * क्यों बदला (AUDIT-01 F1/F2/F8):
 *  - पहले यहाँ हर module `import` से सीधे चढ़ता था — एक भी module टूटा तो **पूरा app** गिर जाता था
 *    (M13 में अकेले 44 टूटे imports हैं)। इसलिए अब हर module अलग से, dynamic import से चढ़ता है:
 *    जो नहीं चढ़ पाया वो साफ़ लिखा जाता है, बाक़ी app चलता रहता है।
 *  - पहले कोई helmet/cors/error-handler/404 नहीं था — अब है।
 *
 * ROUGH है — auth/tenant guard हर route पर लगाना टास्क #009 में आएगा।
 */

import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { requestTracer } from './common/middleware/request-tracer';
import { auditContextMiddleware } from './common/middleware/audit-context';
import { authMiddleware } from './common/middleware/auth-middleware';
import { tenantMiddleware } from './common/middleware/tenant-middleware';
import { MODULE_MOUNTS, type ModuleMount } from './module-registry';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') ?? true, credentials: true }));

// ⚠️ Webhook signature असली bytes पर बनती है — यह route JSON-parse से पहले raw रहेगा
// (टास्क #013 इसे पूरा करेगा; AUDIT-02 → M18-3)
app.use('/api/v1/integrations/webhook', express.raw({ type: '*/*', limit: '2mb' }));

app.use(express.json({ limit: '10mb' }));
app.use(requestTracer);
app.use(auditContextMiddleware);

// ─── टास्क #009: /api/v1/* पर एक ही जगह auth+tenant (41 फाइलों में नहीं) ───
// छूट सिर्फ़ ये (सूची इससे बाहर कुछ नहीं):
const PUBLIC_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/otp',
  '/api/v1/integrations/webhook',
  // ── M01 (2026-09-04) ──
  // ये दोनों M01 की routes फ़ाइल में "Public — no auth required" लिखे हैं और
  // contract में भी इन पर `security:` नहीं है (जबकि /config और /system-info पर है)।
  // पर यहाँ सूची में न होने से ये 401 दे रहे थे — यानी मॉड्यूल की घोषणा और असल
  // बर्ताव उलटे थे। health की पूरी उपयोगिता ही यह है कि उसे monitoring/load
  // balancer बिना token बुला सके; 401 देने वाला health check बेकार है।
  '/api/v1/foundation/health',
  '/api/v1/foundation/maintenance',
];
const isPublicPath = (p: string): boolean =>
  PUBLIC_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`) || p.startsWith(`${pre}?`));

app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  if (isPublicPath(req.originalUrl)) return next();
  return authMiddleware(req, res, next);
});
// ⚠️ tenant पर भी वही छूट लगनी ज़रूरी है (समीक्षक AI, 2026-09-02):
// पहले यह बिना जाँच के हर /api/v1 पर चलता था — इसलिए /auth/login भी 403 हो रहा था,
// यानी कोई login ही नहीं कर सकता था। चलाकर पकड़ा (login → 403), यहीं ठीक किया।
app.use('/api/v1', (req: Request, res: Response, next: NextFunction) => {
  if (isPublicPath(req.originalUrl)) return next();
  return tenantMiddleware(req, res, next);
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

export interface MountResult {
  code: string;
  path: string;
  status: 'mounted' | 'skipped' | 'failed';
  reason?: string;
}

/** हर module अलग-अलग चढ़ता है — एक का गिरना दूसरे को नहीं गिराएगा */
export async function registerModules(): Promise<MountResult[]> {
  const results: MountResult[] = [];

  for (const m of MODULE_MOUNTS as ModuleMount[]) {
    if (!m.mounted || !m.load) {
      results.push({ code: m.code, path: m.path, status: 'skipped', reason: m.blockedBy ?? 'अभी mount के लिए तैयार नहीं' });
      continue;
    }
    try {
      const router = await m.load();
      app.use(m.path, router);
      results.push({ code: m.code, path: m.path, status: 'mounted' });
    } catch (err) {
      results.push({ code: m.code, path: m.path, status: 'failed', reason: err instanceof Error ? err.message : String(err) });
    }
  }

  // यह पता हमेशा सच बताएगा कि इस वक़्त कौन चढ़ा, कौन नहीं
  app.get('/readyz', (_req, res) => res.json({ ok: true, modules: results }));

  // ── 404 — module routes के बाद ही आना चाहिए ──
  app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'NOT_FOUND', path: req.originalUrl });
  });

  // ── आख़िरी error handler (4 arguments ज़रूरी — वरना express इसे नहीं पहचानता) ──
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    const requestId = (req as Request & { requestId?: string }).requestId;
    // eslint-disable-next-line no-console
    console.error('[GNT] unhandled error', { requestId, path: req.originalUrl, message: err.message });
    res.status(500).json({ error: 'INTERNAL_ERROR', request_id: requestId });
  });

  return results;
}
