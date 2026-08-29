// ⚠️ WIRING AUDIT NOTE (2026-08-28) — यह file M13 के असली/wired entry point (index.ts -> workflow.routes/job.routes/schedule.routes
// -> workflow.controller.ts/job.controller.ts/schedule.controller.ts + scheduler.service.ts + event.handler.ts) से जुड़ी हुई NAHI है।
// यह एक दूसरा, अलग (duplicate) scaffold लगता है जो कभी real path से wire नहीं हुआ, और इसमें broken imports हैं
// (जैसे '../../../m02-auth/src/middleware', '../../../m03-core/src/middleware', '../engine/WorkflowEngine',
// '../scheduler/SchedulerService' — ये paths repo में कहीं मौजूद नहीं हैं)।
// FIX नहीं किया गया — सिर्फ FLAG किया गया, क्योंकि silent delete/rename मना है (Krisna's rule)।
// Krisna से confirm चाहिए: इसे हटाना है, या इसमें जो useful लॉजिक (जैसे WebhookController का HMAC verification) है
// उसे असली wired path में merge करना है।

import { EventBus } from '../../../m04-events/src/EventBus';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { PrismaClient } from '@prisma/client';

export class AutomationEventSubscriber {
  constructor(
    private eventBus: EventBus,
    private engine: WorkflowEngine,
    private prisma: PrismaClient
  ) {}

  async subscribe() {
    const eventTypes = ['user.created', 'record.updated', 'payment.received', 'invoice.paid'];

    for (const eventType of eventTypes) {
      await this.eventBus.subscribe(eventType, async (payload: any) => {
        await this.handleEventTrigger(eventType, payload);
      });
    }
  }

  private async handleEventTrigger(eventType: string, payload: any) {
    const triggers = await this.prisma.workflowTrigger.findMany({
      where: {
        triggerType: 'EVENT',
        isActive: true,
        config: {
          path: ['eventType'],
          equals: eventType
        }
      },
      include: { workflow: true }
    });

    for (const trigger of triggers) {
      const filter = trigger.config?.filter;
      if (filter && !this.matchesFilter(filter, payload)) continue;

      await this.engine.execute(trigger.workflowId, payload, {
        tenantId: trigger.tenantId,
        triggerSource: 'EVENT',
        workflowId: trigger.workflowId
      });
    }
  }

  private matchesFilter(filter: any, payload: any): boolean {
    return Object.entries(filter).every(([key, value]) => {
      const payloadValue = key.split('.').reduce((obj, k) => obj?.[k], payload);
      return payloadValue === value;
    });
  }
}
