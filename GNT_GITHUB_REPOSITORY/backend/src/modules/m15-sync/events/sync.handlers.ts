// ============================================================
// M15 Sync Module — Event Subscriber (in-process shared bus)
//
// पहले यह BullMQ Worker('gnt-events') था जो Redis par sunta tha — par us
// Redis queue ko koi feed nahi karta tha (dead), aur event names UPPER_CASE
// (PAYMENT_CREATED) the jo shared bus ke dot-case (payment.completed) se mel
// nahi khate the। अब M11 ke असली 'payment.completed' event par (shared
// in-process bus) real-time sync trigger hota hai — tenant-scoped।
// ============================================================

import { eventBus } from '@/common/events/event-bus';
import { SyncService } from '../services/sync.service';

export class SyncEventSubscriber {
  private static registered = false;

  static initialize(): void {
    if (SyncEventSubscriber.registered) return; // दोबारा mount पर दोहरा subscribe नहीं
    SyncEventSubscriber.registered = true;

    // M11 payment.completed → active PAYMENT sync configs trigger (tenant-scoped)
    eventBus.subscribe('payment.completed', (event: unknown) => {
      void SyncEventSubscriber.handlePaymentChange(event).catch((e) =>
        console.error('[M15] payment sync trigger failed:', e)
      );
    });

    console.log('[M15] Event subscriber initialized (in-process bus)');
  }

  private static async handlePaymentChange(event: unknown): Promise<void> {
    const ev = (event ?? {}) as Record<string, unknown>;
    const tenantId = (ev.tenantId ?? ev.companyId ?? ev.company_id) as string | undefined;
    if (!tenantId) return;

    const configs = await SyncService.listConfigs(tenantId, { status: 'ACTIVE' });
    const paymentConfigs = configs.filter((c) =>
      (c.entityConfigs ?? []).some((ec) => ec.isActive && ec.internalEntity === 'PAYMENT')
    );

    for (const config of paymentConfigs) {
      try {
        await SyncService.triggerSync(
          { syncConfigId: config.id, triggeredBy: 'EVENT', entityType: 'PAYMENT' },
          tenantId
        );
      } catch (err) {
        console.error(
          `[M15] Failed to queue PAYMENT sync for config ${config.configCode}:`,
          (err as Error).message
        );
      }
    }
  }
}
