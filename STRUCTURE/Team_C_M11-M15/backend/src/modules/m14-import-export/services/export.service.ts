import { PrismaClient, ExportJob, ExportStatus } from '@prisma/client';
import { createObjectCsvWriter } from 'csv-writer';
import * as XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { ExportConfig, ExportColumn } from '../types/export.types';
import path from 'path';

const prisma = new PrismaClient();

export class ExportService {
  static async createJob(data: {
    tenantId: string;
    fileName: string;
    fileType: string;
    entityType: string;
    filters?: any;
    columns?: any;
    createdBy: string;
  }): Promise<ExportJob> {
    return prisma.exportJob.create({ data });
  }

  static async processJob(jobId: string): Promise<void> {
    const job = await prisma.exportJob.findUnique({ where: { id: jobId } });
    if (!job) throw new Error('Export job not found');

    await prisma.exportJob.update({
      where: { id: jobId },
      data: { status: ExportStatus.PROCESSING }
    });

    try {
      // Mock data fetch - in real app, query entity table
      const mockData = await this.fetchEntityData(job.entityType, job.filters as any, job.columns as any);
      const filePath = await this.generateFile(job, mockData);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: ExportStatus.COMPLETED,
          filePath,
          fileUrl: `/api/exports/download/${jobId}`,
          totalRows: mockData.length,
          completedAt: new Date(),
          expiresAt
        }
      });
    } catch (error) {
      await prisma.exportJob.update({
        where: { id: jobId },
        data: { status: ExportStatus.FAILED, completedAt: new Date() }
      });
      throw error;
    }
  }

  private static async generateFile(job: ExportJob, data: any[]): Promise<string> {
    const outputDir = 'uploads/exports/';
    const baseName = `${job.id}_${Date.now()}`;

    switch (job.fileType.toLowerCase()) {
      case 'csv':
        return this.generateCSV(data, job.columns as ExportColumn[], path.join(outputDir, `${baseName}.csv`));
      case 'xlsx':
        return this.generateExcel(data, job.columns as ExportColumn[], path.join(outputDir, `${baseName}.xlsx`));
      case 'json':
        return this.generateJSON(data, path.join(outputDir, `${baseName}.json`));
      case 'pdf':
        return this.generatePDF(data, job.columns as ExportColumn[], path.join(outputDir, `${baseName}.pdf`));
      default:
        throw new Error(`Unsupported export format: ${job.fileType}`);
    }
  }

  private static async generateCSV(data: any[], columns: ExportColumn[], filePath: string): Promise<string> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: columns.map(col => ({ id: col.field, title: col.header }))
    });
    await csvWriter.writeRecords(data);
    return filePath;
  }

  private static async generateExcel(data: any[], columns: ExportColumn[], filePath: string): Promise<string> {
    const worksheetData = [
      columns.map(col => col.header),
      ...data.map(row => columns.map(col => row[col.field]))
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, filePath);
    return filePath;
  }

  private static async generateJSON(data: any[], filePath: string): Promise<string> {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  private static async generatePDF(data: any[], columns: ExportColumn[], filePath: string): Promise<string> {
    // Placeholder for PDF generation - would use puppeteer or pdfkit
    writeFileSync(filePath, JSON.stringify({ data, columns }));
    return filePath;
  }

  private static async fetchEntityData(entityType: string, filters: any, columns: any): Promise<any[]> {
    // Mock data - replace with actual Prisma queries
    return Array.from({ length: 100 }, (_, i) => ({
      id: `ENT-${i + 1}`,
      name: `${entityType} Item ${i + 1}`,
      email: `item${i + 1}@example.com`,
      price: (Math.random() * 1000).toFixed(2),
      quantity: Math.floor(Math.random() * 100),
      createdAt: new Date().toISOString()
    }));
  }

  static async getJobStatus(jobId: string): Promise<ExportJob | null> {
    return prisma.exportJob.findUnique({ where: { id: jobId } });
  }

  static async listJobs(tenantId: string, entityType?: string): Promise<ExportJob[]> {
    return prisma.exportJob.findMany({
      where: { tenantId, ...(entityType && { entityType }) },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
