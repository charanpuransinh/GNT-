/**
 * M18 — Integration Service (PUBLIC API)
 * Owner: D4-DELTA
 * 
 * PUBLIC METHODS:
 *   getGatewayStatus(type)         → Frontend status page
 *   generateAPIKey(permissions)    → API key manager
 *   CRUD integrations
 *   testConnection
 */
import crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  IntegrationConfig,
  CreateIntegrationConfigDto,
  UpdateIntegrationConfigDto,
  ApiKeyResponse,
  CreateApiKeyDto,
  GatewayStatusDto,
  GatewayType,
  GatewayStatus,
  GatewayTestResult,
} from '../types/integration.types';
import { IntegrationRepository } from '../repositories/integration.repository';
import { GatewayService } from './gateway.service';
import { GATEWAY_STATUS_CHANGED } from '../events/integration.events';

export class IntegrationService {
  constructor(
    private readonly repository: IntegrationRepository,
    private readonly gatewayService: GatewayService,
    private readonly eventBus: EventEmitter,
  ) {}

  // ─── Integration CRUD ───

  async createIntegration(dto: CreateIntegrationConfigDto): Promise<IntegrationConfig> {
    return this.repository.createIntegration({
      ...dto,
      status: GatewayStatus.PENDING,
    });
  }

  async getIntegrationById(id: string): Promise<IntegrationConfig | null> {
    return this.repository.findIntegrationById(id);
  }

  async listIntegrations(filters: {
    company_id?: string;
    type?: GatewayType;
    status?: GatewayStatus;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ items: IntegrationConfig[]; total: number; page: number; limit: number }> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const { items, total } = await this.repository.findIntegrations({
      ...filters,
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findIntegrationByProvider(provider: string): Promise<IntegrationConfig | null> {
    // Find first active integration matching provider name
    const { items } = await this.repository.findIntegrations({
      is_active: true,
    });
    return items.find(i => i.provider.toLowerCase() === provider.toLowerCase()) ?? null;
  }

  async updateIntegration(id: string, dto: UpdateIntegrationConfigDto): Promise<IntegrationConfig> {
    const existing = await this.repository.findIntegrationById(id);
    if (!existing) throw new Error('Integration not found');

    const updated = await this.repository.updateIntegration(id, dto);

    // Emit status change event if status changed
    if (dto.status && dto.status !== existing.status) {
      this.eventBus.emit(GATEWAY_STATUS_CHANGED, {
        integration_id: id,
        previous_status: existing.status,
        current_status: dto.status,
        provider: updated.provider,
        type: updated.type,
      });
    }

    return updated;
  }

  async deleteIntegration(id: string): Promise<IntegrationConfig> {
    return this.repository.deleteIntegration(id);
  }

  // ─── Gateway Status ───

  async getGatewayStatus(companyId: string, type?: GatewayType): Promise<GatewayStatusDto[]> {
    const { items } = await this.repository.findIntegrations({
      company_id: companyId,
      type,
      is_active: true,
    });

    return Promise.all(
      items.map(async (integration) => {
        const testResult = await this.gatewayService.testConnection(integration);
        return {
          type: integration.type,
          provider: integration.provider,
          status: testResult.success ? GatewayStatus.ACTIVE : GatewayStatus.ERROR,
          last_checked: testResult.timestamp,
          latency_ms: testResult.latency_ms,
          message: testResult.message,
        };
      }),
    );
  }

  async testIntegrationConnection(integrationId: string): Promise<GatewayTestResult> {
    const integration = await this.repository.findIntegrationById(integrationId);
    if (!integration) throw new Error('Integration not found');
    return this.gatewayService.testConnection(integration);
  }

  // ─── API Key Management ───

  async generateApiKey(dto: CreateApiKeyDto): Promise<ApiKeyResponse> {
    const plainKey = `gnt_${crypto.randomBytes(32).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

    const record = await this.repository.createApiKey({
      ...dto,
      key_hash: keyHash,
    });

    return {
      id: record.id,
      name: record.name,
      permissions: record.permissions,
      expires_at: record.expires_at,
      created_at: record.created_at,
      plain_key: plainKey, // Shown ONLY once
    };
  }

  async listApiKeys(companyId: string): Promise<Omit<ApiKeyResponse, 'plain_key'>[]> {
    const keys = await this.repository.findApiKeysByCompany(companyId);
    return keys.map(k => ({
      id: k.id,
      name: k.name,
      permissions: k.permissions,
      expires_at: k.expires_at,
      created_at: k.created_at,
    }));
  }

  async revokeApiKey(id: string): Promise<void> {
    await this.repository.deleteApiKey(id);
  }

  async validateApiKey(plainKey: string): Promise<{ valid: boolean; permissions?: string[] }> {
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');
    // TODO(production): add a short-lived cache in front of this lookup
    // and rate-limit repeated invalid attempts per IP/key prefix.
    const record = await this.repository.findApiKeyByHash(keyHash);

    if (!record) {
      return { valid: false };
    }

    if (record.expires_at && record.expires_at < new Date()) {
      return { valid: false };
    }

    return { valid: true, permissions: record.permissions };
  }
}
