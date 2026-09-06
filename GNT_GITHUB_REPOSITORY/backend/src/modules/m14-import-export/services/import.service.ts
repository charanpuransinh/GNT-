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
import { promises as fs } from 'fs';
import path from 'path';
import { partyService } from '@/modules/m05-party-management';
import { ProductService } from '@/modules/m06-inventory';

const progressEmitter = new EventEmitter();
const productService = new ProductService();

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
      let skippedRows = 0;
      const validationErrors: { rowNumber: number; errors: unknown; data: ImportRow }[] = [];
      const warnings: { rowNumber: number; warning: string; data: ImportRow }[] = [];

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;

        for (const row of batch) {
          const result = validator.validateRow(row, fieldMapping);
          if (result.isValid) {
            // Duplicate detect (skip/warn) — generic column-mapping se aaya data, unique key se check
            const dupKey = await ImportService.findExisting(job.targetEntity, tenantId, result.data);
            if (dupKey) {
              skippedRows++;
              warnings.push({
                rowNumber: row._rowNumber,
                warning: `Duplicate ${dupKey} — skipped (duplicateHandling=${job.duplicateHandling})`,
                data: row
              });
              continue;
            }
            try {
              // असली insert — सिर्फ़ गिनती नहीं (पहले "successfully imported" झूठ था)
              await ImportService.insertRow(job.targetEntity, tenantId, result.data);
              successRows++;
            } catch (e) {
              failedRows++;
              validationErrors.push({
                rowNumber: row._rowNumber,
                errors: (e as Error).message,
                data: row
              });
            }
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
            skippedRows,
            validationReport: { errors: validationErrors.slice(-100), warnings: warnings.slice(-100) } as unknown as Prisma.InputJsonValue
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
          skippedRows,
          validationReport: { errors: validationErrors, warnings } as unknown as Prisma.InputJsonValue,
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

  /** असली entity table में insert — M05 party / M06 product के public API से (M21 जैसा) */
  private static async insertRow(entityType: string, tenantId: string, data: Record<string, unknown>): Promise<{ id: string }> {
    const t = (entityType ?? '').toLowerCase();
    if (t === 'customer' || t === 'supplier' || t === 'party') {
      const party = await partyService.createParty(tenantId, {
        party_type: t === 'supplier' ? 'supplier' : 'customer',
        name: String(data.name ?? data.customerName ?? data.full_name ?? 'बिना-नाम'),
        gstin: (data.gstin as string) ?? null,
        phone: (data.phone as string) ?? null,
        email: (data.email as string) ?? null,
        billing_address: (data.address as string) ?? null,
        state_code: (data.state as string) ?? null,
        opening_balance: Number(data.openingBalance ?? 0) || 0,
        opening_type: 'dr',
      });
      return { id: party.id };
    }
    if (t === 'product' || t === 'item' || t === 'inventory') {
      const product = await productService.createProduct({
        company_id: tenantId,
        name: String(data.name ?? data.productName ?? data.itemName ?? 'बिना-नाम'),
        code: (data.sku as string) ?? null,
        hsn_code: (data.hsn as string) ?? null,
        unit: (data.unit as string) ?? null,
        sale_price: Number(data.price ?? data.sale_price) || undefined,
        purchase_price: Number(data.purchasePrice ?? data.purchase_price) || undefined,
      });
      return { id: product.id };
    }
    throw new Error(`Import target '${entityType}' अभी wired नहीं — सिर्फ़ customer/supplier/product समर्थित (fail-closed, झूठा success नहीं)`);
  }

  /** Duplicate detect — generic column-mapping data, unique key se (koi hardcoding nahi) */
  private static async findExisting(entityType: string, tenantId: string, data: Record<string, unknown>): Promise<string | null> {
    const t = (entityType ?? '').toLowerCase();
    if (t === 'customer' || t === 'supplier' || t === 'party') {
      const partyType = t === 'supplier' ? 'supplier' : 'customer';
      const gstin = data.gstin as string | undefined;
      const name = String(data.name ?? data.customerName ?? data.full_name ?? '');
      const or: Record<string, unknown>[] = [];
      if (gstin) or.push({ gstin });
      if (name) or.push({ name });
      if (or.length === 0) return null;
      const existing = await prisma.party_master.findFirst({ where: { company_id: tenantId, party_type: partyType, OR: or as never } });
      return existing ? 'party' : null;
    }
    if (t === 'product' || t === 'item' || t === 'inventory') {
      const code = (data.sku as string) ?? null;
      const name = String(data.name ?? data.productName ?? data.itemName ?? '');
      const or: Record<string, unknown>[] = [];
      if (code) or.push({ code });
      if (name) or.push({ name });
      if (or.length === 0) return null;
      const existing = await prisma.product_master.findFirst({ where: { company_id: tenantId, OR: or as never } });
      return existing ? 'product' : null;
    }
    return null;
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
      fileBuffer?: Buffer;
      fileName?: string;
      fileType?: string;
      fileSize?: number;
      filePath?: string;
      entityType?: string;
      module?: string;
      createdBy?: string;
      userId?: string;
      mappingOverride?: FieldMapping[];
      options?: { dryRun?: boolean };
    };
    const fileType = (d.fileType ?? 'csv').toLowerCase().split('/').pop() ?? 'csv';
    const ext = fileType.includes('xlsx') || fileType.includes('sheet') ? 'xlsx' : fileType.includes('json') ? 'json' : 'csv';
    const fileName = d.fileName ?? `upload.${ext}`;

    // असली file ज़मीन पर रखो (memory-buffer से) — पहले hardcoded path से कभी file नहीं पढ़ी जाती थी
    let filePath = d.filePath ?? '';
    if (d.fileBuffer) {
      const dir = path.join(process.cwd(), 'uploads', 'imports', d.tenantId);
      await fs.mkdir(dir, { recursive: true });
      filePath = path.join(dir, `${Date.now()}-${fileName}`);
      await fs.writeFile(filePath, d.fileBuffer);
    }

    const job = await ImportService.createJob({
      tenantId: d.tenantId,
      fileName,
      fileType: ext,
      fileSize: d.fileSize ?? d.fileBuffer?.length ?? 0,
      filePath: filePath || 'uploads/imports/upload',
      entityType: d.entityType ?? d.module ?? 'IMPORT',
      createdBy: d.createdBy ?? d.userId ?? 'system',
    });

    // असली processing — dryRun नहीं तो तुरंत चलाओ (पहले processJob कभी चलता ही नहीं था)
    if (!d.options?.dryRun) {
      let mapping = d.mappingOverride;
      if (!mapping) {
        try {
          const preview = await ImportService.previewFile(job.fileKey, job.fileType);
          mapping = preview.suggestedMapping;
        } catch {
          mapping = [];
        }
      }
      ImportService.processJob(job.id, mapping, d.tenantId).catch((e) => {
        // background me fail hua bhi to job status FAILED ho jaata hai (processJob ke catch me)
        void e;
      });
    }

    return job;
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
