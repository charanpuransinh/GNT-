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
