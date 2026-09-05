// M14 — Import Service (LIVE) — tenant-scoped
// हर job की query company_id (tenantId) से बंधी है — fail-closed।

import { ImportJob, Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import { CSVParser } from '../utils/csvParser';
import { ExcelParser } from '../utils/excelParser';
import { JSONParser } from '../utils/jsonParser';
import { ValidationEngine } from '../validators/import.validators';
import { ImportRow, FieldMapping, ImportPreview, ImportProgress } from '../types/import.types';
import { EventEmitter } from 'events';

const progressEmitter = new EventEmitter();

export class ImportService {
  static async createJob(data: {
    tenantId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    filePath: string;
    entityType: string;
    createdBy: string;
  }): Promise<ImportJob> {
    return prisma.importJob.create({
      data: {
        tenantId: data.tenantId,
        jobNumber: `IMP-${Date.now()}`,
        name: data.fileName,
        targetModule: data.entityType,
        targetEntity: data.entityType,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize,
        fileUrl: data.filePath,
        fileKey: data.filePath,
        createdBy: data.createdBy,
      },
    });
  }

  static async previewFile(filePath: string, fileType: string): Promise<ImportPreview> {
    let result: { headers: string[]; rows: ImportRow[]; totalRows: number };

    switch (fileType.toLowerCase()) {
      case 'csv':
        result = await CSVParser.preview(filePath, 10);
        break;
      case 'xlsx':
      case 'xls':
        result = ExcelParser.preview(filePath, 10);
        break;
      case 'json':
        result = JSONParser.preview(filePath, 10);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    const suggestedMapping = this.suggestFieldMapping(result.headers, result.rows[0] || {});

    return {
      headers: result.headers,
      rows: result.rows,
      totalRows: result.totalRows,
      detectedType: fileType,
      suggestedMapping
    };
  }

  static async processJob(jobId: string, fieldMapping: FieldMapping[], tenantId: string): Promise<void> {
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new Error('Import job not found');

    await prisma.importJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'PROCESSING' }
    });

    try {
      let rows: ImportRow[];
      switch (job.fileType.toLowerCase()) {
        case 'csv': {
          const csvResult = await CSVParser.parse(job.fileKey);
          rows = csvResult.rows;
          break;
        }
        case 'xlsx':
        case 'xls': {
          const excelResult = ExcelParser.parse(job.fileKey);
          rows = excelResult.rows;
          break;
        }
        case 'json': {
          const jsonResult = JSONParser.parse(job.fileKey);
          rows = jsonResult.rows;
          break;
        }
        default:
          throw new Error(`Unsupported file type: ${job.fileType}`);
      }

      await prisma.importJob.updateMany({
        where: { id: jobId, tenantId },
        data: { totalRows: rows.length }
      });

      const validator = ValidationEngine.createEntityValidator(job.targetEntity);
      const batchSize = 100;
      const totalBatches = Math.ceil(rows.length / batchSize);
      let successRows = 0;
      let failedRows = 0;
      const validationErrors: { rowNumber: number; errors: unknown; data: ImportRow }[] = [];

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        for (const row of batch) {
          const result = validator.validateRow(row, fieldMapping);
          if (result.isValid) {
            successRows++;
            // असली entity table में save अगले चरण का काम — अभी validation ही असली काम है
          } else {
            failedRows++;
            validationErrors.push({
              rowNumber: row._rowNumber,
              errors: result.errors,
              data: row
            });
          }
        }

        await prisma.importJob.updateMany({
          where: { id: jobId, tenantId },
          data: {
            processedRows: i + batch.length,
            successRows,
            failedRows,
            validationReport: { errors: validationErrors.slice(-100) } as unknown as Prisma.InputJsonValue
          }
        });

        this.emitProgress(jobId, {
          jobId,
          status: 'PROCESSING',
          totalRows: rows.length,
          processedRows: i + batch.length,
          successRows,
          failedRows,
          currentBatch: batchNumber,
          totalBatches
        });
      }

      await prisma.importJob.updateMany({
        where: { id: jobId, tenantId },
        data: {
          status: failedRows > 0 && successRows === 0 ? 'FAILED' : 'COMPLETED',
          processedRows: rows.length,
          successRows,
          failedRows,
          validationReport: { errors: validationErrors } as unknown as Prisma.InputJsonValue,
          completedAt: new Date()
        }
      });
    } catch (error) {
      await prisma.importJob.updateMany({
        where: { id: jobId, tenantId },
        data: {
          status: 'FAILED',
          completedAt: new Date()
        }
      });
      throw error;
    }
  }

  static async getJobStatus(jobId: string, tenantId: string): Promise<ImportJob | null> {
    return prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
  }

  static async listJobs(tenantId: string, entityType?: string): Promise<ImportJob[]> {
    return prisma.importJob.findMany({
      where: { tenantId, ...(entityType && { targetEntity: entityType }) },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async cancelJob(jobId: string, tenantId: string): Promise<ImportJob> {
    const result = await prisma.importJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'CANCELLED' }
    });
    if (result.count === 0) throw new Error('Import job not found');
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new Error('Import job not found');
    return job;
  }

  // ─── नई controllers यही नाम बुलाती हैं ───
  static async createImportJob(data: unknown): Promise<ImportJob> {
    const d = data as {
      tenantId: string;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      entityType?: string;
      module?: string;
      createdBy?: string;
      userId?: string;
    };
    return ImportService.createJob({
      tenantId: d.tenantId,
      fileName: d.fileName ?? 'upload',
      fileType: d.fileType ?? 'csv',
      fileSize: d.fileSize ?? 0,
      filePath: d.filePath ?? 'uploads/imports/upload',
      entityType: d.entityType ?? d.module ?? 'IMPORT',
      createdBy: d.createdBy ?? d.userId ?? 'system',
    });
  }
  static async getImportJob(jobId: string, tenantId?: string): Promise<ImportJob | null> {
    if (!tenantId) throw new Error('Tenant required');
    return ImportService.getJobStatus(jobId, tenantId);
  }
  static async listImportJobs(tenantId: string, _opts?: unknown): Promise<ImportJob[]> {
    return ImportService.listJobs(tenantId);
  }
  static async cancelImportJob(jobId: string, tenantId?: string): Promise<ImportJob> {
    if (!tenantId) throw new Error('Tenant required');
    return ImportService.cancelJob(jobId, tenantId);
  }
  static async retryImportJob(jobId: string, tenantId?: string): Promise<ImportJob> {
    if (!tenantId) throw new Error('Tenant required');
    const result = await prisma.importJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'QUEUED' }
    });
    if (result.count === 0) throw new Error('Import job not found');
    const job = await prisma.importJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new Error('Import job not found');
    return job;
  }
  static async validateImport(jobId: string, tenantId?: string): Promise<ImportJob | null> {
    if (!tenantId) throw new Error('Tenant required');
    return ImportService.getJobStatus(jobId, tenantId);
  }

  static onProgress(callback: (progress: ImportProgress) => void) {
    progressEmitter.on('progress', callback);
  }

  private static emitProgress(jobId: string, progress: ImportProgress) {
    progressEmitter.emit('progress', progress);
  }

  private static suggestFieldMapping(headers: string[], sampleRow: ImportRow): FieldMapping[] {
    const commonMappings: Record<string, string[]> = {
      name: ['name', 'product_name', 'full_name', 'customer_name', 'title'],
      email: ['email', 'email_address', 'e-mail'],
      phone: ['phone', 'phone_number', 'mobile', 'contact'],
      price: ['price', 'unit_price', 'amount', 'cost'],
      sku: ['sku', 'product_code', 'code', 'item_code'],
      quantity: ['quantity', 'qty', 'stock', 'inventory'],
      description: ['description', 'desc', 'details'],
      address: ['address', 'street', 'location'],
      city: ['city', 'town'],
      country: ['country', 'nation']
    };

    return headers.map(header => {
      const lowerHeader = header.toLowerCase().replace(/[\s_-]/g, '');
      let targetField = header;
      let required = false;

      for (const [field, aliases] of Object.entries(commonMappings)) {
        if (aliases.some(a => lowerHeader.includes(a.replace(/[\s_-]/g, '')))) {
          targetField = field;
          if (['name', 'email', 'sku'].includes(field)) required = true;
          break;
        }
      }

      return {
        sourceColumn: header,
        targetField,
        required,
        transform: undefined
      };
    });
  }
}
