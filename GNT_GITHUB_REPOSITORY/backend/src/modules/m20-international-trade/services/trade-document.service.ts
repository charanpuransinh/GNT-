// GNT M20 — Trade Document Service (PUBLIC)
// Owner: D4-DELTA | Consumed by: M08, M10, M11

import { PrismaClient, DocumentType, DocumentStatus } from '@prisma/client';
import { TradeRepository } from '../repositories/trade.repository';
import { AppError } from '../../../shared/errors/app-error';
import { GenerateDocumentRequest, TradeDocument } from '../types/trade.types';

export class TradeDocumentService {
  private tradeRepo: TradeRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.tradeRepo = new TradeRepository(prisma);
  }

  // ── PUBLIC: Generate Document ──
  async generateDocument(
    companyId: string,
    request: GenerateDocumentRequest
  ): Promise<TradeDocument> {
    const job = await this.tradeRepo.findById(request.trade_job_id, companyId);
    if (!job) {
      throw new AppError('NOT_FOUND', `Trade job ${request.trade_job_id} not found`, 404);
    }

    const content = this.buildDocumentContent(request.document_type, job, request.metadata);

    const doc = await this.prisma.trade_document.create({
      data: {
        company_id: companyId,
        trade_job_id: request.trade_job_id,
        document_type: request.document_type as DocumentType,
        content_json: content,
        status: 'generated' as DocumentStatus,
      },
    });

    return this.mapToTradeDocument(doc);
  }

  // ── PUBLIC: Get Document ──
  async getDocument(id: string, companyId: string): Promise<TradeDocument | null> {
    const doc = await this.prisma.trade_document.findFirst({
      where: { id, company_id: companyId },
      include: { trade_job: true },
    });
    return doc ? this.mapToTradeDocument(doc) : null;
  }

  // ── PUBLIC: List Documents by Trade Job ──
  async listDocuments(tradeJobId: string, companyId: string): Promise<TradeDocument[]> {
    const docs = await this.prisma.trade_document.findMany({
      where: { trade_job_id: tradeJobId, company_id: companyId },
      orderBy: { created_at: 'desc' },
    });
    return docs.map(this.mapToTradeDocument);
  }

  // ── PUBLIC: Update Document Status ──
  async updateDocumentStatus(
    id: string,
    companyId: string,
    status: DocumentStatus
  ): Promise<TradeDocument> {
    const doc = await this.prisma.trade_document.update({
      where: { id },
      data: { status },
    });
    return this.mapToTradeDocument(doc);
  }

  private buildDocumentContent(
    type: string,
    job: any,
    metadata?: Record<string, unknown>
  ): Record<string, unknown> {
    const base = {
      reference_no: job.reference_no,
      type: job.type,
      hsn_code: job.hsn_code,
      quantity: Number(job.quantity),
      currency: job.currency,
      fx_rate: Number(job.fx_rate),
      value_fob: job.value_fob ? Number(job.value_fob) : null,
      value_cif: job.value_cif ? Number(job.value_cif) : null,
      customs_duty: job.customs_duty ? Number(job.customs_duty) : null,
      gst_amount: job.gst_amount ? Number(job.gst_amount) : null,
      generated_at: new Date().toISOString(),
      metadata: metadata || {},
    };

    switch (type) {
      case 'boe':
        return { ...base, document_name: 'Bill of Entry', form_type: 'Form 24' };
      case 'shipping_bill':
        return { ...base, document_name: 'Shipping Bill', form_type: 'Form 13' };
      case 'commercial_invoice':
        return { ...base, document_name: 'Commercial Invoice', form_type: 'Standard' };
      case 'packing_list':
        return { ...base, document_name: 'Packing List', form_type: 'Standard' };
      case 'certificate_of_origin':
        return { ...base, document_name: 'Certificate of Origin', form_type: 'Form A' };
      default:
        return base;
    }
  }

  private mapToTradeDocument(doc: any): TradeDocument {
    return {
      id: doc.id,
      company_id: doc.company_id,
      trade_job_id: doc.trade_job_id,
      document_type: doc.document_type,
      content_json: doc.content_json as Record<string, unknown>,
      generated_at: doc.generated_at.toISOString(),
      status: doc.status,
      file_url: doc.file_url,
    };
  }
}
