// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — BULLMQ QUEUE SETUP
// Module: M13 | Layer: Queue Infrastructure
// Dependencies: bullmq, ioredis
// ============================================================================

import { Queue, RedisOptions } from "bullmq";
import { M13_QUEUE_NAMES } from "../config/m13.config";

// NOT SPECIFIED: Redis connection config sourced from M04 Config Module
const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  // NOT SPECIFIED: Auth, TLS, cluster config per deployment v2.1
};

export const m13WorkflowQueue = new Queue(M13_QUEUE_NAMES.WORKFLOW, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const m13ScheduledQueue = new Queue(M13_QUEUE_NAMES.SCHEDULED, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "fixed", delay: 10000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const m13RetryQueue = new Queue(M13_QUEUE_NAMES.RETRY, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: 50,
    removeOnFail: 100,
  },
});

export const m13EventQueue = new Queue(M13_QUEUE_NAMES.EVENT, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "fixed", delay: 3000 },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

export function getM13Queue(name: string): Queue {
  switch (name) {
    case M13_QUEUE_NAMES.WORKFLOW:
      return m13WorkflowQueue;
    case M13_QUEUE_NAMES.SCHEDULED:
      return m13ScheduledQueue;
    case M13_QUEUE_NAMES.RETRY:
      return m13RetryQueue;
    case M13_QUEUE_NAMES.EVENT:
      return m13EventQueue;
    default:
      throw new Error(`[M13] Unknown queue name: ${name}`);
  }
}

export async function closeM13Queues(): Promise<void> {
  await m13WorkflowQueue.close();
  await m13ScheduledQueue.close();
  await m13RetryQueue.close();
  await m13EventQueue.close();
}
