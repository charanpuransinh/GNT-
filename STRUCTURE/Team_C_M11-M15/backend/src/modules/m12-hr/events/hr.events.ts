// [LOCK-14] HR Event Publisher
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class HrEventPublisher {
  async publish(eventType: string, payload: any) {
    const event = await prisma.hrEventLog.create({
      data: { eventType, payload, module: 'M12', processed: false }
    });
    console.log(`[M12-EVENT] ${eventType}:`, JSON.stringify(payload));
    return event;
  }

  async getUnprocessedEvents(targetModule?: string) {
    return prisma.hrEventLog.findMany({ where: { processed: false }, orderBy: { createdAt: 'asc' }, take: 100 });
  }

  async markProcessed(id: string) {
    return prisma.hrEventLog.update({ where: { id }, data: { processed: true } });
  }
}
