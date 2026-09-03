// M14 — Import Job Processor
// Lock: LOCK_13_PROCESSOR
import { PrismaClient } from '@prisma/client';
import { ParserService } from './services/parser.service';
import { EventBus } from './events/import.events';

const prisma = new PrismaClient();
const parser = new ParserService();

export class ImportProcessor {
  private eventBus = new EventBus();

  async process(jobId: string, fileBufferBase64: string, fileType: string, options?: any) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' }
    });

    try {
      const buffer = Buffer.from(fileBufferBase64, 'base64');
      const result = await parser.parse(buffer, fileType as any, options);

      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'COMPLETED',
          totalRows: result.meta.totalRows,
          processedRows: result.meta.validRows,
          successRows: result.meta.validRows,
          failedRows: result.errors.length,
          errorLog: result.errors as any,
          completedAt: new Date(),
        }
      });

      // Publish completion event for other modules to consume
      await this.eventBus.publish('import.job.completed', {
        jobId,
        module: (await prisma.importJob.findUnique({ where: { id: jobId } }))?.targetModule,
        totalRows: result.meta.totalRows,
        successRows: result.meta.validRows,
      });

    } catch (err: any) {
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          errorLog: [{ message: err.message, code: 'PROCESSOR_ERROR' }] as any,
          completedAt: new Date(),
        }
      });
      await this.eventBus.publish('import.job.failed', { jobId, error: err.message });
    }
  }
}
