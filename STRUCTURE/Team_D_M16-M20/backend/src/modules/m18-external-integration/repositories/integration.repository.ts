/**
 * M18 — Integration Repository
 * Owner: D4-DELTA | Table Owner: M18 ONLY
 * WARNING: No external module may access this directly.
 */
import { PrismaClient } from '@prisma/client';
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
} from '../types/integration.types';

export class IntegrationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── Integration Config ───

  async createIntegration(data: CreateIntegrationConfigDto): Promise<IntegrationConfig> {
    return this.prisma.integration_config.create({ data }) as Promise<IntegrationConfig>;
  }

  async findIntegrationById(id: string): Promise<IntegrationConfig | null> {
    return this.prisma.integration_config.findUnique({ where: { id } }) as Promise<IntegrationConfig | null>;
  }

  async findIntegrations(filters: {
    company_id?: string;
    type?: GatewayType;
    status?: GatewayStatus;
    is_active?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ items: IntegrationConfig[]; total: number }> {
    const where: any = {};
    if (filters.company_id) where.company_id = filters.company_id;
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

  async findActiveIntegrationByType(companyId: string, type: GatewayType): Promise<IntegrationConfig | null> {
    return this.prisma.integration_config.findFirst({
      where: { company_id: companyId, type, is_active: true },
    }) as Promise<IntegrationConfig | null>;
  }

  async updateIntegration(id: string, data: UpdateIntegrationConfigDto): Promise<IntegrationConfig> {
    return this.prisma.integration_config.update({
      where: { id },
      data,
    }) as Promise<IntegrationConfig>;
  }

  async deleteIntegration(id: string): Promise<IntegrationConfig> {
    return this.prisma.integration_config.delete({ where: { id } }) as Promise<IntegrationConfig>;
  }

  // ─── API Key Registry ───

  async createApiKey(data: CreateApiKeyDto): Promise<ApiKeyRegistry> {
    return this.prisma.api_key_registry.create({ data }) as Promise<ApiKeyRegistry>;
  }

  async findApiKeyById(id: string): Promise<ApiKeyRegistry | null> {
    return this.prisma.api_key_registry.findUnique({ where: { id } }) as Promise<ApiKeyRegistry | null>;
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

  async deleteApiKey(id: string): Promise<ApiKeyRegistry> {
    return this.prisma.api_key_registry.delete({ where: { id } }) as Promise<ApiKeyRegistry>;
  }

  // ─── Webhook Log ───

  async createWebhookLog(data: CreateWebhookLogDto): Promise<WebhookLog> {
    return this.prisma.webhook_log.create({ data }) as Promise<WebhookLog>;
  }

  async findWebhookLogById(id: string): Promise<WebhookLog | null> {
    return this.prisma.webhook_log.findUnique({ where: { id } }) as Promise<WebhookLog | null>;
  }

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
