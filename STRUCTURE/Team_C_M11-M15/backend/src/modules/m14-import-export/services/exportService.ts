/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — EXPORT SERVICE                          ║
 * ║  Lock Artifact #9 — Business Logic for Export Operations     ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { PrismaClient } from '@prisma/client';
import { ExportJob, ExportTemplate, ExportProgress } from '../types/importExport.types';
import { generateCSV, generateExcel, generateJSON } from '../utils/excelHandler';

const prisma = new PrismaClient();

interface ListOptions {
  tenantId: string;
  status?: string;
  entityType?: string;
  page: number;
  limit: number;
  search?: string;
}

export class ExportService {
  // ── LIST EXPORTS ──
  async listExports(options: ListOptions) {
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
      prisma.exportJob.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.exportJob.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  // ── GET SINGLE EXPORT ──
  async getExport(tenantId: string, id: string): Promise<ExportJob | null> {
    return prisma.exportJob.findFirst({ where: { id, tenantId } }) as any;
  }

  // ── CREATE EXPORT ──
  async createExport(data: Partial<ExportJob>): Promise<ExportJob> {
    return prisma.exportJob.create({ data: data as any }) as any;
  }

  // ── UPDATE EXPORT ──
  async updateExport(tenantId: string, id: string, updates: Partial<ExportJob>): Promise<ExportJob> {
    return prisma.exportJob.update({
      where: { id },
      data: updates as any,
    }) as any;
  }

  // ── DELETE EXPORT ──
  async deleteExport(tenantId: string, id: string): Promise<void> {
    await prisma.exportJob.deleteMany({ where: { id, tenantId } });
  }

  // ── GET PROGRESS ──
  async getProgress(tenantId: string, id: string): Promise<ExportProgress> {
    const job = await this.getExport(tenantId, id);
    if (!job) throw new Error('Export job not found');

    const totalRows = job.totalRows || 1;
    const processed = job.processedRows || 0;
    const percentage = Math.round((processed / totalRows) * 100);

    return {
      jobId: job.id,
      status: job.status as any,
      totalRows,
      processedRows: processed,
      percentage,
    };
  }

  // ── GENERATE EXPORT FILE ──
  async generateExportFile(tenantId: string, jobId: string): Promise<string> {
    const job = await this.getExport(tenantId, jobId);
    if (!job) throw new Error('Export job not found');

    await this.updateExport(tenantId, jobId, { status: 'processing' });

    try {
      // Fetch data from the target entity
      const data = await this.fetchEntityData(tenantId, job);
      const selectedFields = (job.selectedFields || []) as string[];

      let fileBuffer: Buffer;
      let contentType: string;
      let extension: string;

      switch (job.fileFormat) {
        case 'csv':
          fileBuffer = await generateCSV(data, selectedFields);
          contentType = 'text/csv';
          extension = 'csv';
          break;
        case 'excel':
          fileBuffer = await generateExcel(data, selectedFields, job.name);
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
          extension = 'xlsx';
          break;
        case 'json':
          fileBuffer = await generateJSON(data, selectedFields);
          contentType = 'application/json';
          extension = 'json';
          break;
        default:
          fileBuffer = await generateCSV(data, selectedFields);
          contentType = 'text/csv';
          extension = 'csv';
      }

      // In production: upload to S3 / storage
      const fileUrl = `/exports/${tenantId}/${jobId}.${extension}`;

      await this.updateExport(tenantId, jobId, {
        status: 'completed',
        fileUrl,
        fileSize: fileBuffer.length,
        totalRows: data.length,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });

      return fileUrl;
    } catch (error) {
      await this.updateExport(tenantId, jobId, {
        status: 'failed',
      });
      throw error;
    }
  }

  // ── EXPORT TEMPLATES ──
  async listTemplates(tenantId: string, entityType?: string) {
    const where: any = { tenantId };
    if (entityType) where.entityType = entityType;
    return prisma.exportTemplate.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getTemplate(tenantId: string, id: string) {
    return prisma.exportTemplate.findFirst({ where: { id, tenantId } });
  }

  async createTemplate(data: Partial<ExportTemplate>) {
    return prisma.exportTemplate.create({ data: data as any });
  }

  async updateTemplate(tenantId: string, id: string, updates: Partial<ExportTemplate>) {
    return prisma.exportTemplate.update({ where: { id }, data: updates as any });
  }

  async deleteTemplate(tenantId: string, id: string) {
    await prisma.exportTemplate.deleteMany({ where: { id, tenantId } });
  }

  // ── PRIVATE HELPERS ──
  private async fetchEntityData(tenantId: string, job: ExportJob): Promise<Record<string, any>[]> {
    // In production: query the actual entity tables via PUBLIC API
    // This is a mock implementation
    const mockData: Record<string, Record<string, any>[]> = {
      leads: [
        { id: 'L001', name: 'Rahul Sharma', email: 'rahul@example.com', phone: '+91-9876543210', company: 'TechCorp', status: 'New', source: 'Website' },
        { id: 'L002', name: 'Priya Patel', email: 'priya@example.com', phone: '+91-9876543211', company: 'DataSys', status: 'Contacted', source: 'Referral' },
        { id: 'L003', name: 'Amit Kumar', email: 'amit@example.com', phone: '+91-9876543212', company: 'CloudNet', status: 'Qualified', source: 'LinkedIn' },
      ],
      customers: [
        { id: 'C001', name: 'Acme Corp', email: 'contact@acme.com', phone: '+91-9876543213', address: 'Mumbai, India', city: 'Mumbai' },
        { id: 'C002', name: 'Globex Ltd', email: 'info@globex.com', phone: '+91-9876543214', address: 'Delhi, India', city: 'Delhi' },
      ],
      products: [
        { sku: 'PRD-001', name: 'Enterprise Plan', price: 9999, quantity: 100, category: 'Software' },
        { sku: 'PRD-002', name: 'Pro Plan', price: 4999, quantity: 250, category: 'Software' },
      ],
    };

    return mockData[job.entityType] || [];
  }
}
