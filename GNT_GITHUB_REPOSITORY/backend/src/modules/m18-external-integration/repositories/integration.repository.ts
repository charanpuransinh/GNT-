/**
 * M18 — Integration Repository
 * Owner: D4-DELTA | Table Owner: M18 ONLY
 * WARNING: No external module may access this directly.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import {
  IntegrationConfig,
  ApiKeyRegistry,
  WebhookLog,
  CreateIntegrationConfigDto,
  UpdateIntegrationConfigDto,
  CreateApiKeyDto,
  CreateWebhookLogDto,
  GatewayType,
  GatewayStatus,
  WebhookStatus,
} from '../types/integration.types';

export class IntegrationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Integration Config ───

  async createIntegration(data: CreateIntegrationConfigDto): Promise<IntegrationConfig> {
    return this.prisma.integration_config.create({
      data: {
        company_id: data.company_id,
        provider: data.provider,
        type: data.type,
        config_json: data.config_json as Prisma.InputJsonValue,
        status: (data.status ?? GatewayStatus.PENDING) as string,
        is_active: data.is_active ?? true,
      },
    }) as Promise<IntegrationConfig>;
  }

  /** company से बँधा — दूसरी कंपनी की id डालने पर null मिलेगा (IDOR बंद)। */
  async findIntegrationById(id: string, companyId: string): Promise<IntegrationConfig | null> {
    return this.prisma.integration_config.findFirst({
      where: { id, company_id: companyId },
    }) as Promise<IntegrationConfig | null>;
  }

  async findIntegrations(filters: {
    company_id?: string;
    type?: GatewayType;
    status?: GatewayStatus;
    is_active?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ items: IntegrationConfig[]; total: number }> {
    // सुरक्षा (P0): company_id के बिना यह query हर कंपनी के gateway config लौटा देती
    // (जिनमें provider credentials का संदर्भ होता है)। इसलिए fail-closed।
    if (!filters.company_id) {
      throw new Error('company_id ज़रूरी है — tenant scope के बिना integration सूची नहीं मिलेगी');
    }

    const where: any = { company_id: filters.company_id };
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;

    const [items, total] = await Promise.all([
      this.prisma.integration_config.findMany({
        where,
        skip: filters.skip ?? 0,
        take: filters.take ?? 20,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.integration_config.count({ where }),
    ]);
    return { items: items as IntegrationConfig[], total };
  }

  async findActiveIntegrationByType(companyId: string, type: string): Promise<IntegrationConfig | null> {
    return this.prisma.integration_config.findFirst({
      where: { company_id: companyId, type, is_active: true },
    }) as Promise<IntegrationConfig | null>;
  }

  async updateIntegration(id: string, companyId: string, data: UpdateIntegrationConfigDto): Promise<IntegrationConfig> {
    // पहले company से मिलान — वरना दूसरी कंपनी का gateway बदला जा सकता था
    const owned = await this.prisma.integration_config.findFirst({ where: { id, company_id: companyId } });
    if (!owned) throw new Error('Integration not found');

    return this.prisma.integration_config.update({
      where: { id },
      data: {
        ...(data.provider !== undefined ? { provider: data.provider } : {}),
        ...(data.config_json !== undefined ? { config_json: data.config_json as Prisma.InputJsonValue } : {}),
        ...(data.status !== undefined ? { status: data.status as string } : {}),
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      },
    }) as Promise<IntegrationConfig>;
  }

  async deleteIntegration(id: string, companyId: string): Promise<IntegrationConfig> {
    const owned = await this.prisma.integration_config.findFirst({ where: { id, company_id: companyId } });
    if (!owned) throw new Error('Integration not found');

    return this.prisma.integration_config.delete({ where: { id } }) as Promise<IntegrationConfig>;
  }

  // ─── API Key Registry ───

  async createApiKey(data: CreateApiKeyDto & { key_hash: string }): Promise<ApiKeyRegistry> {
    return this.prisma.api_key_registry.create({
      data: {
        company_id: data.company_id,
        name: data.name,
        key_hash: data.key_hash,
        permissions: data.permissions,
        expires_at: data.expires_at ?? null,
        created_by: data.created_by,
      },
    }) as Promise<ApiKeyRegistry>;
  }

  /** company से बँधा — API key दूसरी कंपनी की नहीं पढ़ी जा सकती। */
  async findApiKeyById(id: string, companyId: string): Promise<ApiKeyRegistry | null> {
    return this.prisma.api_key_registry.findFirst({
      where: { id, company_id: companyId },
    }) as Promise<ApiKeyRegistry | null>;
  }

  /**
   * Look up an API key by its SHA-256 hash. key_hash has a unique index
   * (added in database/m18-schema.prisma), so this is a direct indexed
   * lookup — no full-table scan.
   */
  async findApiKeyByHash(keyHash: string): Promise<ApiKeyRegistry | null> {
    return this.prisma.api_key_registry.findUnique({ where: { key_hash: keyHash } }) as Promise<ApiKeyRegistry | null>;
  }

  async findApiKeysByCompany(companyId: string): Promise<ApiKeyRegistry[]> {
    const now = new Date();
    return this.prisma.api_key_registry.findMany({
      where: {
        company_id: companyId,
        OR: [{ expires_at: null }, { expires_at: { gt: now } }],
      },
      orderBy: { created_at: 'desc' },
    }) as Promise<ApiKeyRegistry[]>;
  }

  async deleteApiKey(id: string, companyId: string): Promise<ApiKeyRegistry> {
    // बिना इस जाँच के कोई भी दूसरी कंपनी की API key रद्द कर सकता था (उनकी सेवा ठप)
    const owned = await this.prisma.api_key_registry.findFirst({ where: { id, company_id: companyId } });
    if (!owned) throw new Error('API key not found');

    return this.prisma.api_key_registry.delete({ where: { id } }) as Promise<ApiKeyRegistry>;
  }

  // ─── Webhook Log ───

  async createWebhookLog(data: CreateWebhookLogDto): Promise<WebhookLog> {
    return this.prisma.webhook_log.create({
      data: {
        provider: data.provider,
        event_id: data.event_id ?? null,
        payload: data.payload as Prisma.InputJsonValue,
        headers: data.headers as Prisma.InputJsonValue,
        status: (data.status ?? WebhookStatus.RECEIVED) as string,
        error_message: data.error_message ?? null,
      },
    }) as Promise<WebhookLog>;
  }

  async findWebhookByEventId(provider: string, eventId: string): Promise<WebhookLog | null> {
    return this.prisma.webhook_log.findUnique({
      where: { provider_event_id: { provider, event_id: eventId } },
    }) as Promise<WebhookLog | null>;
  }

  /**
   * ⚠️ अंदरूनी उपयोग ही — `webhook_log` में company_id है ही नहीं (यह कच्चा inbound journal है)।
   * इसे किसी HTTP route से मत जोड़ना; जोड़ना हो तो पहले model में company_id आए।
   */
  async findWebhookLogById(id: string): Promise<WebhookLog | null> {
    return this.prisma.webhook_log.findUnique({ where: { id } }) as Promise<WebhookLog | null>;
  }

  /** ⚠️ अंदरूनी उपयोग ही — ऊपर वाला नोट पढ़ो (webhook_log में company_id नहीं है)। */
  async findWebhookLogsByProvider(provider: string, limit: number = 50): Promise<WebhookLog[]> {
    return this.prisma.webhook_log.findMany({
      where: { provider },
      orderBy: { created_at: 'desc' },
      take: limit,
    }) as Promise<WebhookLog[]>;
  }

  async updateWebhookStatus(id: string, status: string, errorMessage?: string | null): Promise<WebhookLog> {
    return this.prisma.webhook_log.update({
      where: { id },
      data: {
        status,
        error_message: errorMessage ?? null,
        processed_at: new Date(),
      },
    }) as Promise<WebhookLog>;
  }
}
