// [LOCK-14] HR Event Publisher
//
// 2026-09-06 (Claude — M11–M22 wiring pass): पहले यह सिर्फ़ m12_hr_event_log में
// row लिखता था और वह row कभी कोई नहीं पढ़ता था (getUnprocessedEvents/markProcessed
// tests के अलावा कहीं call नहीं) — यानी M12 का हर event (PAYROLL_GENERATED,
// PAYROLL_PAID, LEAVE_APPLIED…) एक dead table में गिरता था, M13/M11/M16 तक कभी
// नहीं पहुँचता था। अब:
//   1. वही row audit-trail के लिए बनती है (processed: true — कोई pending queue
//      होने का झूठा संकेत नहीं),
//   2. उसी वक़्त event साझा in-process eventBus पर भी publish होता है — वही
//      fire-and-forget pattern जो M11 payment.service इस्तेमाल करता है — ताकि M13
//      के EVENT-trigger rules (triggerEvent: 'payroll.generated' आदि) इसे पकड़ें।
//   3. bus का event-नाम dot-case होता है (payroll.generated) — event-registry.json
//      और बाक़ी system की परंपरा (gst.einvoice.generated, payment.completed) के
//      अनुरूप।
//   4. tenantId अब payload में ज़रूरी है — M13 का rule-matching इसी से tenant-safe
//      होता है (बिना इसके हर company के rules चल जाते — automation.handlers.ts का
//      दर्ज किया हुआ bug)।
import { prisma } from '@/common/config/prisma';
import { eventBus } from '@/common/events/event-bus';

/** PAYROLL_GENERATED -> payroll.generated */
const toBusName = (eventType: string): string => eventType.toLowerCase().replace(/_/g, '.');

export class HrEventPublisher {
  async publish(tenantId: string, eventType: string, payload: Record<string, unknown>) {
    const enriched = { ...payload, tenantId };
    const event = await prisma.hrEventLog.create({
      data: {
        eventType,
        payload: enriched,
        module: 'M12',
        processed: true,
        employeeId: typeof payload.employeeId === 'string' ? payload.employeeId : null,
      },
    });
    console.log(`[M12-EVENT] ${eventType}:`, JSON.stringify(enriched));
    // साझा bus पर relay — एक handler का गिरना payroll/leave API को नहीं गिराएगा
    void eventBus
      .publish(toBusName(eventType), enriched)
      .catch((e) => console.error(`[M12→bus] "${toBusName(eventType)}" handler failed:`, e));
    return event;
  }

  async getUnprocessedEvents(_targetModule?: string) {
    return prisma.hrEventLog.findMany({ where: { processed: false }, orderBy: { createdAt: 'asc' }, take: 100 });
  }

  async markProcessed(id: string) {
    return prisma.hrEventLog.update({ where: { id }, data: { processed: true } });
  }
}
