// backup.service.ts - M15 Sync Module
import { prisma } from '@/common/config/prisma'; // ✅ FIX: Use singleton instead of new PrismaClient()

export class BackupService {
  private eventEmitter: any;

  // Use global prisma instance
  // All backup/restore operations share single connection pool
  
  private async runBackup(tenantId: string, backupId: string) {
    try {
      // simulate backup
      await prisma.syncJob.update({
        where: { id: backupId },
        data: { status: 'completed' }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Backup failed';
      await prisma.syncJob.update({
        where: { id: backupId },
        data: { status: 'failed', errorMessage: message }
      });
      this.eventEmitter?.emit('backup.failed', { tenantId, backupId, error: message });
    }
  }

  private async executeRestore(tenantId: string, restoreJobId: string): Promise<void> {
    try {
      // simulate restore
      await prisma.syncJob.update({
        where: { id: restoreJobId },
        data: { status: 'completed' }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Restore failed';
      await prisma.syncJob.update({
        where: { id: restoreJobId },
        data: { status: 'failed', errorMessage: message }
      });
      this.eventEmitter?.emit('restore.failed', { tenantId, restoreJobId, error: message });
    }
  }
}
