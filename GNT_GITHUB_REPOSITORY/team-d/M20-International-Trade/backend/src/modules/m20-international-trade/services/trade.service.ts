// GNT M20 — Trade Service (PUBLIC)
// Owner: D4-DELTA | Consumed by: M08 (Export), M07 (Import), M10, M11

import { PrismaClient, TradeType, TradeStatus } from '@prisma/client';
import { TradeRepository } from '../repositories/trade.repository';
import { HSNService } from './hsn.service';
import { FXService } from './fx.service';
import { CustomsService } from './customs.service';
import { EventBus } from '../../../shared/events/event-bus'; // assumed shared infra
import { TradeEventPayload } from '../types/trade.types';
import { AppError } from '../../../shared/errors/app-error';

export interface CreateExportShipmentInput {
  company_id: string;
  reference_no: string;
  party_id: string;
  product_id: string;
  hsn_code: string;
  quantity: number;
  value_fob?: number;
  value_cif?: number;
  currency: string;
  fx_rate?: number;
}

export interface CreateImportShipmentInput extends CreateExportShipmentInput {}

export class TradeService {
  private tradeRepo: TradeRepository;
  private hsnService: HSNService;
  private fxService: FXService;
  private customsService: CustomsService;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly eventBus: EventBus,
    hsnService?: HSNService,
    fxService?: FXService,
    customsService?: CustomsService
  ) {
    this.tradeRepo = new TradeRepository(prisma);
    this.hsnService = hsnService || new HSNService(prisma);
    this.fxService = fxService || new FXService(prisma);
    this.customsService = customsService || new CustomsService(prisma);
  }

  // ── PUBLIC: Create Export Shipment ──
  async createExportShipment(data: CreateExportShipmentInput) {
    return this.createShipment({ ...data, type: 'export' });
  }

  // ── PUBLIC: Create Import Shipment ──
  async createImportShipment(data: CreateImportShipmentInput) {
    return this.createShipment({ ...data, type: 'import' });
  }

  private async createShipment(data: CreateExportShipmentInput & { type: TradeType }) {
    // Validate HSN
    const hsnValidation = await this.hsnService.validateHSN(data.hsn_code);
    if (!hsnValidation.valid) {
      throw new AppError('INVALID_HSN', `HSN code ${data.hsn_code} is not valid`, 400);
    }

    // Resolve FX rate if not provided
    let fxRate = data.fx_rate;
    if (!fxRate && data.currency !== 'INR') {
      const rateRecord = await this.fxService.getFXRate(data.company_id, 'INR', data.currency);
      if (!rateRecord) {
        throw new AppError('FX_RATE_MISSING', `FX rate not found for INR/${data.currency}`, 400);
      }
      fxRate = Number(rateRecord.rate);
    }
    if (!fxRate) fxRate = 1; // INR/INR

    // Check duplicate reference
    const exists = await this.tradeRepo.exists(data.reference_no, data.company_id);
    if (exists) {
      throw new AppError('DUPLICATE_REFERENCE', `Reference ${data.reference_no} already exists`, 409);
    }

    const job = await this.tradeRepo.create({
      company_id: data.company_id,
      type: data.type,
      reference_no: data.reference_no,
      party_id: data.party_id,
      product_id: data.product_id,
      hsn_code: data.hsn_code,
      quantity: data.quantity as any,
      value_fob: data.value_fob as any,
      value_cif: data.value_cif as any,
      currency: data.currency,
      fx_rate: fxRate as any,
      status: 'draft',
    });

    // Publish event
    const eventPayload: TradeEventPayload = {
      trade_job_id: job.id,
      company_id: job.company_id,
      type: job.type as TradeType,
      reference_no: job.reference_no,
      timestamp: new Date().toISOString(),
    };

    if (data.type === 'export') {
      await this.eventBus.publish('trade.export.created', eventPayload);
    } else {
      await this.eventBus.publish('trade.import.created', eventPayload);
    }

    return job;
  }

  // ── PUBLIC: Get Trade Job ──
  async getTradeJob(id: string, companyId: string) {
    const job = await this.tradeRepo.findById(id, companyId);
    if (!job) throw new AppError('NOT_FOUND', `Trade job ${id} not found`, 404);
    return job;
  }

  // ── PUBLIC: List Trade Jobs ──
  async listTradeJobs(
    companyId: string,
    filters: { type?: TradeType; status?: TradeStatus; page?: number; limit?: number } = {}
  ) {
    return this.tradeRepo.findMany(companyId, filters);
  }

  // ── PUBLIC: Update Trade Job ──
  async updateTradeJob(id: string, companyId: string, data: Partial<CreateExportShipmentInput>) {
    const existing = await this.tradeRepo.findById(id, companyId);
    if (!existing) throw new AppError('NOT_FOUND', `Trade job ${id} not found`, 404);

    const updateData: any = {};
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.value_fob !== undefined) updateData.value_fob = data.value_fob;
    if (data.value_cif !== undefined) updateData.value_cif = data.value_cif;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.fx_rate !== undefined) updateData.fx_rate = data.fx_rate;

    return this.tradeRepo.update(id, companyId, updateData);
  }

  // ── PUBLIC: Update Status ──
  async updateStatus(id: string, companyId: string, status: TradeStatus) {
    return this.tradeRepo.updateStatus(id, companyId, status);
  }

  // ── PUBLIC: Delete Trade Job ──
  async deleteTradeJob(id: string, companyId: string) {
    return this.tradeRepo.delete(id, companyId);
  }
}
