// M14 — Import Event Bus
// Lock: LOCK_14_EVENTS
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const QUEUE_NAME = 'm14:import:queue';

export class EventBus {
  async publish(event: string, payload: any) {
    const msg = JSON.stringify({ event, payload, timestamp: new Date().toISOString() });
    await redis.publish(`m14:events:${event}`, msg);
    await redis.lpush(QUEUE_NAME, msg);
  }

  async subscribe(event: string, handler: (payload: any) => Promise<void>) {
    const subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await subscriber.subscribe(`m14:events:${event}`);
    subscriber.on('message', async (channel, message) => {
      const { payload } = JSON.parse(message);
      await handler(payload);
    });
  }

  async processQueue(processor: (job: any) => Promise<void>) {
    while (true) {
      const msg = await redis.brpop(QUEUE_NAME, 0);
      if (msg) {
        const { event, payload } = JSON.parse(msg[1]);
        if (event === 'import.job.created') {
          await processor(payload);
        }
      }
    }
  }
}
