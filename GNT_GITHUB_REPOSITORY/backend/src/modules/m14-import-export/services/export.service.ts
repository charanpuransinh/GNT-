// M14 — Export Service (LIVE) — tenant-scoped
// हर job की query company_id (tenantId) से बंधी है — fail-closed।

import { ExportJob, Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import { writeFileSync, mkdirSync } from 'fs';
import { ExportColumn } from '../types/export.types';
import path from 'path';

export class ExportService {
  static async createJob(data: {
    tenantId: string;
    name: string;
    format: string;
    sourceEntity: string;
    sourceModule?: string;
    filters?: Record<string, unknown>;
    columns?: unknown[];
    createdBy: string;
  }): Promise<ExportJob> {
    return prisma.exportJob.create({
      data: {
        tenantId: data.tenantId,
        jobNumber: `EXP-${Date.now()}`,
        name: data.name,
        format: data.format,
        sourceModule: data.sourceModule ?? 'M14',
        sourceEntity: data.sourceEntity,
        filters: (data.filters ?? null) as Prisma.InputJsonValue,
        columns: (data.columns ?? []) as unknown as Prisma.InputJsonValue[],
        createdBy: data.createdBy,
      },
    });
  }

  static async processJob(jobId: string, tenantId: string): Promise<void> {
    const job = await prisma.exportJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new Error('Export job not found');

    await prisma.exportJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'PROCESSING' }
    });

    try {
      const mockData = await this.fetchEntityData(job.sourceEntity, tenantId, job.filters);
      const fileKey = await this.generateFile(job, mockData);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.exportJob.updateMany({
        where: { id: jobId, tenantId },
        data: {
          status: 'COMPLETED',
          fileKey,
          fileUrl: `/api/exports/download/${jobId}`,
          totalRecords: mockData.length,
          completedAt: new Date(),
          expiresAt
        }
      });
    } catch (error) {
      await prisma.exportJob.updateMany({
        where: { id: jobId, tenantId },
        data: { status: 'FAILED', completedAt: new Date() }
      });
      throw error;
    }
  }

  private static async generateFile(job: ExportJob, data: unknown[]): Promise<string> {
    const outputDir = 'uploads/exports/';
    mkdirSync(outputDir, { recursive: true }); // directory pehle banao — csv-writer khud nahi banata
    const baseName = `${job.id}_${Date.now()}`;

    switch (job.format.toLowerCase()) {
      case 'csv':
        return this.generateCSV(data, job.columns as unknown as ExportColumn[], path.join(outputDir, `${baseName}.csv`));
      case 'xlsx':
        return this.generateExcel(data, job.columns as unknown as ExportColumn[], path.join(outputDir, `${baseName}.xlsx`));
      case 'json':
        return this.generateJSON(data, path.join(outputDir, `${baseName}.json`));
      case 'pdf':
        return this.generatePDF(data, job.columns as unknown as ExportColumn[], path.join(outputDir, `${baseName}.pdf`));
      default:
        throw new Error(`Unsupported export format: ${job.format}`);
    }
  }

  private static async generateCSV(data: unknown[], columns: ExportColumn[], filePath: string): Promise<string> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: columns.map(col => ({ id: col.field, title: col.header }))
    });
    await csvWriter.writeRecords(data as Record<string, unknown>[]);
    return filePath;
  }

  private static async generateExcel(data: unknown[], columns: ExportColumn[], filePath: string): Promise<string> {
    const worksheetData = [
      columns.map(col => col.header),
      ...data.map(row => columns.map(col => (row as Record<string, unknown>)[col.field]))
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, filePath);
    return filePath;
  }

  private static async generateJSON(data: unknown[], filePath: string): Promise<string> {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  private static async generatePDF(data: unknown[], columns: ExportColumn[], filePath: string): Promise<string> {
    writeFileSync(filePath, JSON.stringify({ data, columns }));
    return filePath;
  }

  private static async fetchEntityData(entityType: string, tenantId: string, _filters: unknown): Promise<Record<string, unknown>[]> {
    const t = (entityType ?? '').toLowerCase();
    // असली entity table से data (fake 100 items नहीं) — tenant-scoped
    if (t === 'customer' || t === 'party' || t === 'supplier') {
      const rows = await prisma.party_master.findMany({ where: { company_id: tenantId }, take: 500 });
      return rows.map((r) => ({ id: r.id, name: r.name, email: r.email, phone: r.phone, gstin: r.gstin }));
    }
    if (t === 'product' || t === 'item' || t === 'inventory') {
      const rows = await prisma.product_master.findMany({ where: { company_id: tenantId }, take: 500 });
      return rows.map((r) => ({ id: r.id, name: r.name, sku: r.code, hsn: r.hsn_code, price: Number(r.sale_price ?? 0) }));
    }
    return []; // unsupported entity — खाली (ईमानदार), fake नहीं
  }

  static async getJobStatus(jobId: string, tenantId: string): Promise<ExportJob | null> {
    return prisma.exportJob.findFirst({ where: { id: jobId, tenantId } });
  }

  static async listJobs(tenantId: string, entityType?: string): Promise<ExportJob[]> {
    return prisma.exportJob.findMany({
      where: { tenantId, ...(entityType && { sourceEntity: entityType }) },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  static async cancelJob(jobId: string, tenantId: string): Promise<ExportJob> {
    const result = await prisma.exportJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'CANCELLED' }
    });
    if (result.count === 0) throw new Error('Export job not found');
    const job = await prisma.exportJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new Error('Export job not found');
    return job;
  }

  // ─── नई controllers यही नाम बुलाती हैं ───
  static async createExportJob(data: unknown): Promise<ExportJob> {
    const d = data as {
      tenantId: string;
      module?: string;
      entityType?: string;
      format?: string;
      filters?: Record<string, unknown>;
      columns?: unknown[];
      createdBy?: string;
      userId?: string;
      name?: string;
    };
    const job = await ExportService.createJob({
      tenantId: d.tenantId,
      name: d.name ?? `${d.entityType ?? d.module ?? 'export'}-${(d.format ?? 'csv').toLowerCase()}`,
      format: d.format ?? 'csv',
      sourceModule: d.module ?? 'M14',
      sourceEntity: d.entityType ?? 'EXPORT',
      filters: d.filters,
      columns: d.columns,
      createdBy: d.createdBy ?? d.userId ?? '',
    });
    // पहले processJob कभी चलता ही नहीं था — अब असली file बनाने के लिए trigger
    ExportService.processJob(job.id, d.tenantId).catch(() => {});
    return job;
  }
  static async getExportJob(jobId: string, tenantId?: string): Promise<ExportJob | null> {
    if (!tenantId) throw new Error('Tenant required');
    return ExportService.getJobStatus(jobId, tenantId);
  }
  static async listExportJobs(tenantId: string, _opts?: unknown): Promise<ExportJob[]> {
    return ExportService.listJobs(tenantId);
  }
  static async cancelExportJob(jobId: string, tenantId?: string): Promise<ExportJob> {
    if (!tenantId) throw new Error('Tenant required');
    return ExportService.cancelJob(jobId, tenantId);
  }
  static async downloadExport(jobId: string, tenantId?: string): Promise<ExportJob | null> {
    if (!tenantId) throw new Error('Tenant required');
    return ExportService.getJobStatus(jobId, tenantId);
  }
}
