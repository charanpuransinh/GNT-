// M14 — Export Service (LIVE) — tenant-scoped
// हर job की query company_id (tenantId) से बंधी है — fail-closed।

import { createWriteStream, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { prisma } from '@/common/config/prisma';
import { eventBus } from '@/common/events/event-bus';
import { ExportJob, Prisma } from '@prisma/client';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';
import { ExportColumn } from '../types/export.types';

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
      data: { status: 'PROCESSING' },
    });

    try {
      const rows = await this.fetchEntityData(job.sourceEntity, tenantId, job.filters);
      const fileKey = await this.generateFile(job, rows);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.exportJob.updateMany({
        where: { id: jobId, tenantId },
        data: {
          status: 'COMPLETED',
          fileKey,
          fileUrl: `/api/exports/download/${jobId}`,
          totalRecords: rows.length,
          completedAt: new Date(),
          expiresAt,
        },
      });

      // साझा bus पर relay — M13 automation / M17 cache-invalidate (fire-and-forget)
      void eventBus
        .publish('export.completed', {
          tenantId,
          jobId,
          entityType: job.sourceEntity,
          format: job.format,
          totalRecords: rows.length,
          status: 'COMPLETED',
        })
        .catch((e) => console.error('[M14→bus] export.completed handler failed:', e));
    } catch (error) {
      await prisma.exportJob.updateMany({
        where: { id: jobId, tenantId },
        data: { status: 'FAILED', completedAt: new Date() },
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
        return this.generateCSV(
          data,
          job.columns as unknown as ExportColumn[],
          path.join(outputDir, `${baseName}.csv`)
        );
      case 'xlsx':
        return this.generateExcel(
          data,
          job.columns as unknown as ExportColumn[],
          path.join(outputDir, `${baseName}.xlsx`)
        );
      case 'json':
        return this.generateJSON(data, path.join(outputDir, `${baseName}.json`));
      case 'pdf':
        return this.generatePDF(
          data,
          job.columns as unknown as ExportColumn[],
          path.join(outputDir, `${baseName}.pdf`)
        );
      default:
        throw new Error(`Unsupported export format: ${job.format}`);
    }
  }

  private static async generateCSV(
    data: unknown[],
    columns: ExportColumn[],
    filePath: string
  ): Promise<string> {
    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: columns.map((col) => ({ id: col.field, title: col.header })),
    });
    await csvWriter.writeRecords(data as Record<string, unknown>[]);
    return filePath;
  }

  private static async generateExcel(
    data: unknown[],
    columns: ExportColumn[],
    filePath: string
  ): Promise<string> {
    const worksheetData = [
      columns.map((col) => col.header),
      ...data.map((row) => columns.map((col) => (row as Record<string, unknown>)[col.field])),
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

  /** असली tabular PDF (pdfkit) — पहले सिर्फ़ JSON को .pdf नाम से लिखता था */
  private static generatePDF(
    data: unknown[],
    columns: ExportColumn[],
    filePath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const cols: ExportColumn[] = columns?.length
        ? columns
        : Object.keys((data[0] as Record<string, unknown>) ?? {}).map(
            (k) => ({ field: k, header: k }) as ExportColumn
          );

      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      const stream = createWriteStream(filePath);
      stream.on('finish', () => resolve(filePath));
      stream.on('error', reject);
      doc.on('error', reject);
      doc.pipe(stream);

      const left = doc.page.margins.left;
      const usableWidth = doc.page.width - left - doc.page.margins.right;
      const colWidth = usableWidth / Math.max(cols.length, 1);
      const bottom = doc.page.height - doc.page.margins.bottom;

      doc.fontSize(14).text(`Export — ${data.length} record(s)`, { align: 'center' }).moveDown(0.7);

      const drawRow = (values: string[], bold: boolean) => {
        const y = doc.y;
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
        values.forEach((v, i) =>
          doc.text(v, left + i * colWidth, y, { width: colWidth - 4, ellipsis: true })
        );
        doc.moveDown(0.4);
        if (doc.y > bottom) doc.addPage();
      };

      drawRow(
        cols.map((c) => String(c.header)),
        true
      );
      doc
        .moveTo(left, doc.y)
        .lineTo(left + usableWidth, doc.y)
        .stroke()
        .moveDown(0.2);
      for (const row of data as Record<string, unknown>[]) {
        drawRow(
          cols.map((c) => (row[c.field] == null ? '' : String(row[c.field]))),
          false
        );
      }
      doc.end();
    });
  }

  private static readonly SUPPORTED_ENTITIES = [
    'customer/party/supplier',
    'product/item/inventory',
    'invoice',
  ];

  // Export पूरा dataset निकालता है — पहले `take: 500` चुपचाप काट देता था।
  // अब id-cursor से batches में सब लाते हैं; MAX_EXPORT_ROWS से ऊपर → साफ़ error
  // (job FAILED, झूठा "COMPLETED with 500 rows" नहीं)।
  private static readonly PAGE = 1000;
  private static readonly MAX_EXPORT_ROWS = 100_000;

  private static async fetchAllById<T extends { id: string }>(
    page: (cursorId: string | undefined) => Promise<T[]>,
    entityType: string
  ): Promise<T[]> {
    const out: T[] = [];
    let cursorId: string | undefined;
    for (;;) {
      const batch = await page(cursorId);
      out.push(...batch);
      if (batch.length < ExportService.PAGE) break;
      if (out.length > ExportService.MAX_EXPORT_ROWS) {
        throw new Error(
          `Export of "${entityType}" exceeds ${ExportService.MAX_EXPORT_ROWS} rows — narrow the filter or export in parts.`
        );
      }
      cursorId = batch[batch.length - 1].id;
    }
    return out;
  }

  private static async fetchEntityData(
    entityType: string,
    tenantId: string,
    _filters: unknown
  ): Promise<Record<string, unknown>[]> {
    const t = (entityType ?? '').toLowerCase();
    const P = ExportService.PAGE;
    // असली entity table से data (fake items नहीं) — tenant-scoped, पूरा dataset
    if (t === 'customer' || t === 'party' || t === 'supplier') {
      const rows = await ExportService.fetchAllById(
        (cursor) =>
          prisma.party_master.findMany({
            where: { company_id: tenantId },
            take: P,
            orderBy: { id: 'asc' },
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          }),
        entityType
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        gstin: r.gstin,
      }));
    }
    if (t === 'product' || t === 'item' || t === 'inventory') {
      const rows = await ExportService.fetchAllById(
        (cursor) =>
          prisma.product_master.findMany({
            where: { company_id: tenantId },
            take: P,
            orderBy: { id: 'asc' },
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          }),
        entityType
      );
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        sku: r.code,
        hsn: r.hsn_code,
        price: Number(r.sale_price ?? 0),
      }));
    }
    if (t === 'invoice' || t === 'sales_invoice' || t === 'salesinvoice') {
      const rows = await ExportService.fetchAllById(
        (cursor) =>
          prisma.salesInvoice.findMany({
            where: { companyId: tenantId },
            take: P,
            orderBy: { id: 'asc' },
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
          }),
        entityType
      );
      return rows.map((r) => ({
        id: r.id,
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate.toISOString().slice(0, 10),
        customerId: r.customerId,
        status: r.status,
        grandTotal: Number(r.grandTotal),
        paymentStatus: r.paymentStatus,
        amountPaid: Number(r.amountPaid),
      }));
    }
    // unknown entity — चुपचाप खाली file नहीं; साफ़ error ताकि job FAILED हो (झूठा COMPLETED नहीं)
    throw new Error(
      `Unsupported export entity "${entityType}". Supported: ${ExportService.SUPPORTED_ENTITIES.join(', ')}.`
    );
  }

  static async getJobStatus(jobId: string, tenantId: string): Promise<ExportJob | null> {
    return prisma.exportJob.findFirst({ where: { id: jobId, tenantId } });
  }

  static async listJobs(tenantId: string, entityType?: string): Promise<ExportJob[]> {
    return prisma.exportJob.findMany({
      where: { tenantId, ...(entityType && { sourceEntity: entityType }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async cancelJob(jobId: string, tenantId: string): Promise<ExportJob> {
    const result = await prisma.exportJob.updateMany({
      where: { id: jobId, tenantId },
      data: { status: 'CANCELLED' },
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
      name:
        d.name ?? `${d.entityType ?? d.module ?? 'export'}-${(d.format ?? 'csv').toLowerCase()}`,
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
