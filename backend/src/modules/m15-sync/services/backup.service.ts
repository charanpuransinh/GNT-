// backup.service.ts (partial) — safe error handling
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class BackupService {
  private async runBackup(tenantId: string, backupId: string) {
    try {
      // simulate backup
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Backup failed';
      await prisma.backupJob.update({ where: { id: backupId }, data: { status: 'failed', errorMessage: message, completedAt: new Date() } });
      this.eventEmitter.emit('backup.failed', { tenantId, backupId, error: message });
    }
  }

  private async executeRestore(tenantId: string, restoreJobId: string): Promise<void> {
    try {
      // simulate restore
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Restore failed';
      await prisma.restoreJob.update({ where: { id: restoreJobId }, data: { status: 'failed', errorMessage: message } });
      this.eventEmitter.emit('restore.failed', { tenantId, restoreJobId, error: message });
    }
  }
}
