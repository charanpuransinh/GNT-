/**
 * GNT — Backend entry point (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 *
 * क्यों बना: AUDIT-01 की F1 — पूरे backend में कहीं `app.listen` था ही नहीं,
 * यानी server कभी शुरू ही नहीं हो सकता था। यह वही पहला कदम है।
 *
 * ROUGH है — clustering, health-probe की गहराई, metrics बाद के task में।
 */

import { app, registerModules } from './app';

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '0.0.0.0';

const results = await registerModules();
const mounted = results.filter((r) => r.status === 'mounted');
const failed = results.filter((r) => r.status === 'failed');
const skipped = results.filter((r) => r.status === 'skipped');

// eslint-disable-next-line no-console
console.info(`[GNT] modules — चढ़े: ${mounted.length} | गिरे: ${failed.length} | बाक़ी: ${skipped.length}`);
for (const f of failed) console.error(`[GNT] ❌ ${f.code} ${f.path} — ${f.reason}`);
for (const s of skipped) console.warn(`[GNT] ⏭  ${s.code} ${s.path} — ${s.reason}`);

const server = app.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.info(`[GNT] backend listening on http://${HOST}:${PORT} (env=${process.env.NODE_ENV ?? 'development'})`);
});

/** बिना अधूरी request गिराए बंद होना — deploy/restart के वक़्त ज़रूरी */
function shutdown(signal: string): void {
  // eslint-disable-next-line no-console
  console.info(`[GNT] ${signal} मिला — नई request लेना बंद, चालू request पूरी होने दे रहे हैं…`);
  server.close((err?: Error) => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error('[GNT] बंद होते वक़्त गड़बड़:', err);
      process.exit(1);
    }
    process.exit(0);
  });
  // अटकी हुई connection के लिए आख़िरी सीमा
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('[GNT] unhandledRejection:', reason);
});

export { server };
