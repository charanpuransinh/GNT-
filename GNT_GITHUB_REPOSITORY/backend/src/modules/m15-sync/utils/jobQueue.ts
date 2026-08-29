import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { SyncService } from '../services/sync.service';
import { BackupService } from '../services/backup.service';

const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

export const syncQueue = new Queue('m15-sync-jobs', { connection: redis });
export const backupQueue = new Queue('m15-backup-jobs', { connection: redis });

// Sync Job Worker
const syncWorker = new Worker('m15-sync-jobs', async (job) => {
  const { jobId } = job.data;
  await SyncService.processJob(jobId);
}, { connection: redis });

// Backup Job Worker
const backupWorker = new Worker('m15-backup-jobs', async (job) => {
  const { jobId } = job.data;
  await BackupService.processBackup(jobId);
}, { connection: redis });

syncWorker.on('failed', (job, err) => {
  console.error(`[M15] Sync job ${job?.id} failed:`, err.message);
});

backupWorker.on('failed', (job, err) => {
  console.error(`[M15] Backup job ${job?.id} failed:`, err.message);
});
