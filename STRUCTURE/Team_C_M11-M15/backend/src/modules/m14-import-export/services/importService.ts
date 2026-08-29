/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — IMPORT SERVICE                          ║
 * ║  Lock Artifact #8 — Business Logic for Import Operations     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { PrismaClient } from '@prisma/client';
import { ImportJob, ImportTemplate, ImportPreview, ImportProgress, ImportError, FieldMapping, ValidationRule } from '../types/importExport.types';
import { parseCSV, parseExcel, parseJSON } from '../utils/csvParser';
import { applyFieldMapping, validateRow } from '../utils/fieldMapper';
import { generateId } from '../utils/helpers';

const prisma = new PrismaClient();

interface ListOptions {
  tenantId: string;
  status?: string;
  entityType?: string;
  page: number;
  limit: number;
  search?: string;
}

export class ImportService {
  // ── LIST IMPORTS ──
  async listImports(options: ListOptions) {
    const { tenantId, status, entityType, page, limit, search } = options;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (status) where.status = status;
    if (entityType) where.entityType = entityType;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.importJob.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.importJob.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── GET SINGLE IMPORT ──
  async getImport(tenantId: string, id: string): Promise<ImportJob | null> {
    return prisma.importJob.findFirst({ where: { id, tenantId } }) as any;
  }

  // ── CREATE IMPORT ──
  async createImport(data: Partial<ImportJob>): Promise<ImportJob> {
    return prisma.importJob.create({ data: data as any }) as any;
  }

  // ── UPDATE IMPORT ──
  async updateImport(tenantId: string, id: string, updates: Partial<ImportJob>): Promise<ImportJob> {
    return prisma.importJob.update({
      where: { id },
      data: updates as any,
    }) as any;
  }

  // ── DELETE IMPORT ──
  async deleteImport(tenantId: string, id: string): Promise<void> {
    await prisma.importJob.deleteMany({ where: { id, tenantId } });
  }

  // ── HANDLE FILE UPLOAD ──
  async handleUpload(tenantId: string, file: Express.Multer.File) {
    // In production: upload to S3 / local storage
    const fileUrl = `/uploads/${tenantId}/${file.filename}`;
    const format = this.detectFormat(file.originalname);

    return {
      fileUrl,
      fileName: file.originalname,
      fileSize: file.size,
      format,
    };
  }

  // ── GENERATE PREVIEW ──
  async generatePreview(tenantId: string, jobId: string): Promise<ImportPreview> {
    const job = await this.getImport(tenantId, jobId);
    if (!job) throw new Error('Import job not found');

    // Parse first N rows for preview
    const rows = await this.parseFile(job.fileUrl, job.fileFormat, 10);
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    // Auto-detect mapping
    const suggestedMapping = this.suggestMapping(headers, job.entityType);

    return {
      headers,
      sampleRows: rows,
      detectedFormat: job.fileFormat,
      detectedDelimiter: ',',
      totalRows: job.totalRows || 0,
      suggestedMapping,
    };
  }

  // ── VALIDATE IMPORT ──
  async validateImport(tenantId: string, jobId: string) {
    const job = await this.getImport(tenantId, jobId);
    if (!job) throw new Error('Import job not found');

    await this.updateImport(tenantId, jobId, { status: 'validating' });

    const rows = await this.parseFile(job.fileUrl, job.fileFormat);
    const errors: ImportError[] = [];
    const validationRules = (job.validationRules || []) as ValidationRule[];

    for (let i = 0; i < Math.min(rows.length, 100); i++) {
      const row = rows[i];
      const mappedRow = applyFieldMapping(row, job.mapping as FieldMapping[]);
      const rowErrors = validateRow(mappedRow, validationRules, i + 1);
      errors.push(...rowErrors);
    }

    await this.updateImport(tenantId, jobId, {
      status: errors.length > 0 ? 'failed' : 'pending',
      errors: errors as any,
    });

    return { valid: errors.length === 0, errors, totalChecked: Math.min(rows.length, 100) };
  }

  // ── EXECUTE DRY RUN ──
  async executeDryRun(tenantId: string, jobId: string) {
    const job = await this.getImport(tenantId, jobId);
    if (!job) throw new Error('Import job not found');

    const rows = await this.parseFile(job.fileUrl, job.fileFormat, 5);
    const mapping = job.mapping as FieldMapping[];
    const validationRules = (job.validationRules || []) as ValidationRule[];

    const results = rows.map((row, idx) => {
      const mapped = applyFieldMapping(row, mapping);
      const errors = validateRow(mapped, validationRules, idx + 1);
      return { row: idx + 1, mapped, errors, wouldCreate: errors.length === 0 };
    });

    return { dryRun: true, totalRows: rows.length, results };
  }

  // ── GET PROGRESS ──
  async getProgress(tenantId: string, jobId: string): Promise<ImportProgress> {
    const job = await this.getImport(tenantId, jobId);
    if (!job) throw new Error('Import job not found');

    const totalRows = job.totalRows || 1;
    const processed = job.processedRows || 0;
    const percentage = Math.round((processed / totalRows) * 100);

    return {
      jobId: job.id,
      status: job.status as any,
      totalRows,
      processedRows: processed,
      successRows: job.successRows || 0,
      failedRows: job.failedRows || 0,
      currentBatch: Math.ceil(processed / 100),
      totalBatches: Math.ceil(totalRows / 100),
      percentage,
      etaSeconds: job.status === 'processing' ? this.calculateETA(job) : null,
    };
  }

  // ── GET ERRORS ──
  async getErrors(tenantId: string, jobId: string, { page, limit }: { page: number; limit: number }) {
    const job = await this.getImport(tenantId, jobId);
    if (!job) throw new Error('Import job not found');

    const allErrors = (job.errors || []) as ImportError[];
    const start = (page - 1) * limit;
    const items = allErrors.slice(start, start + limit);

    return { items, total: allErrors.length, page, limit };
  }

  // ── GENERATE ERROR REPORT ──
  async generateErrorReport(tenantId: string, jobId: string): Promise<string> {
    const job = await this.getImport(tenantId, jobId);
    if (!job) throw new Error('Import job not found');

    const errors = (job.errors || []) as ImportError[];
    const headers = ['Row', 'Field', 'Value', 'Error', 'Severity'];
    const rows = errors.map(e => [e.rowNumber, e.field, e.value, e.error, e.severity]);

    return [headers, ...rows].map(r => r.join(',')).join('\n');
  }

  // ── IMPORT TEMPLATES ──
  async listTemplates(tenantId: string, entityType?: string) {
    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    return prisma.importTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getTemplate(tenantId: string, id: string) {
    return prisma.importTemplate.findFirst({ where: { id, tenantId } });
  }

  async createTemplate(data: Partial<ImportTemplate>) {
    return prisma.importTemplate.create({ data: data as any });
  }

  async updateTemplate(tenantId: string, id: string, updates: Partial<ImportTemplate>) {
    return prisma.importTemplate.update({ where: { id }, data: updates as any });
  }

  async deleteTemplate(tenantId: string, id: string) {
    await prisma.importTemplate.deleteMany({ where: { id, tenantId } });
  }

  // ── PRIVATE HELPERS ──
  private detectFormat(filename: string) {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv') return 'csv';
    if (ext === 'xlsx' || ext === 'xls') return 'excel';
    if (ext === 'json') return 'json';
    if (ext === 'xml') return 'xml';
    return 'csv';
  }

  private async parseFile(fileUrl: string, format: string, limit?: number) {
    switch (format) {
      case 'csv': return parseCSV(fileUrl, limit);
      case 'excel': return parseExcel(fileUrl, limit);
      case 'json': return parseJSON(fileUrl, limit);
      default: return parseCSV(fileUrl, limit);
    }
  }

  private suggestMapping(headers: string[], entityType: string): FieldMapping[] {
    // Auto-suggest field mappings based on entity type
    const entityFields: Record<string, string[]> = {
      leads: ['name', 'email', 'phone', 'company', 'status', 'source'],
      contacts: ['firstName', 'lastName', 'email', 'phone', 'address'],
      products: ['sku', 'name', 'price', 'quantity', 'category'],
      customers: ['name', 'email', 'phone', 'address', 'city'],
    };

    const fields = entityFields[entityType] || [];
    return headers.map(h => {
      const match = fields.find(f => f.toLowerCase() === h.toLowerCase());
      return {
        sourceField: h,
        targetField: match || h,
        required: false,
      };
    });
  }

  private calculateETA(job: ImportJob): number | null {
    if (job.processedRows === 0) return null;
    const elapsed = Date.now() - new Date(job.updatedAt).getTime();
    const rate = job.processedRows / elapsed; // rows per ms
    const remaining = (job.totalRows || 0) - job.processedRows;
    return Math.round(remaining / rate / 1000);
  }
}
