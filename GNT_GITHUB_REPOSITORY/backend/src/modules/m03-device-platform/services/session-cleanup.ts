// ============================================================================
// M03 — Expired active_session की सफाई का job (टास्क #024 — E1)
//
// जिन sessions की expires_at बीत गई उन्हें status='expired' करता है (delete नहीं —
// इतिहास बना रहे)। tenant-safe: यह किसी कंपनी का डेटा दूसरे को नहीं दिखाता/छूता नहीं —
// सिर्फ़ समय-सीमा पार हुए sessions की अपनी ही पंक्ति का status बदलता है।
// ============================================================================

import { prisma } from '@/common/config/prisma';
import { logger } from '@/common/logging/logger';

export const SESSION_CLEANUP_INTERVAL_MS = 15 * 60 * 1000; // हर 15 मिनट

/** Test के लिए अलग किया गया pure filter — वही जो DB query में जाता है */
export function buildExpiredSessionsFilter(now: Date) {
  return {
    status: { in: ['active', 'idle'] },
    expires_at: { lt: now },
  };
}

export async function runSessionCleanupOnce(now: Date = new Date()): Promise<number> {
  const result = await prisma.active_session.updateMany({
    where: buildExpiredSessionsFilter(now),
    data: { status: 'expired' },
  });
  return result.count;
}

export function startSessionCleanupJob(intervalMs: number = SESSION_CLEANUP_INTERVAL_MS): NodeJS.Timeout {
  const run = async () => {
    try {
      const count = await runSessionCleanupOnce();
      if (count > 0) logger.info('Expired sessions marked', { count });
    } catch (err: unknown) {
      // सफाई की चूक से ऐप नहीं रुकता — अगले चक्र में फिर कोशिश
      logger.error('Session cleanup failed', { error: err instanceof Error ? err.message : err });
    }
  };

  void run(); // चालू होते ही पहली सफाई

  const timer = setInterval(() => void run(), intervalMs);
  timer.unref(); // process को अकेले ज़िंदा न रखे
  return timer;
}
