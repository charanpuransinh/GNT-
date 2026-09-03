// M14 — Export Job Processor
// Lock: LOCK_13_PROCESSOR
import { PrismaClient } from '@prisma/client';
import { FormatterService } from './services/formatter.service';
import { EventBus } from './events/export.events';

const prisma = new PrismaClient();
const formatter = new FormatterService();

export class ExportProcessor {
  private eventBus = new EventBus();

  async process(jobId: string) {
    const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Job not found');

    await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    try {
      // Fetch data from target module via PUBLIC API (cross-module rule)
      const moduleData = await this.fetchModuleData(job.sourceModule, job.sourceEntity, job.filters, job.tenantId);

      const buffer = await formatter.format(
        moduleData,
        job.format,
        job.columns as string[] || undefined
      );

      // Upload to storage (mock URL)
      const fileUrl = `/uploads/exports/${jobId}.${job.format.toLowerCase()}`;

      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          totalRecords: moduleData.length,
          fileUrl,
          completedAt: new Date(),
        }
      });

      await this.eventBus.publish('export.job.completed', { jobId, fileUrl, totalRecords: moduleData.length });

    } catch (err: any) {
      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
        }
      });
      await this.eventBus.publish('export.job.failed', { jobId, error: err.message });
    }
  }

  private async fetchModuleData(module: string, entityType: string, filters: any, tenantId: string): Promise<any[]> {
    // Cross-module call via PUBLIC API only — no direct DB access
    // This calls the target module's public list endpoint
    const baseUrl = process.env[`${module}_API_URL`] || `http://localhost:3000/api/${module.toLowerCase()}`;
    const response = await fetch(`${baseUrl}/${entityType}/list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
      body: JSON.stringify({ filters, limit: 10000 }),
    });
    if (!response.ok) throw new Error(`Module ${module} API error: ${response.statusText}`);
    const data = await response.json();
    return data.items || data;
  }
}
