/**
 * M18 — Integration Tests (Module-level)
 * Owner: D4-DELTA
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { EventEmitter } from 'events';
import { IntegrationRepository } from '../backend/src/modules/m18-external-integration/repositories/integration.repository';
import { IntegrationService } from '../backend/src/modules/m18-external-integration/services/integration.service';
import { GatewayService } from '../backend/src/modules/m18-external-integration/services/gateway.service';
import { WebhookService } from '../backend/src/modules/m18-external-integration/services/webhook.service';
import { GatewayType, GatewayStatus } from '../backend/src/modules/m18-external-integration/types/integration.types';

const prisma = new PrismaClient();
const eventBus = new EventEmitter();

describe('M18 Integration Tests', () => {
  let repository: IntegrationRepository;
  let integrationService: IntegrationService;
  let webhookService: WebhookService;

  beforeAll(async () => {
    repository = new IntegrationRepository(prisma);
    const gatewayService = new GatewayService(repository);
    integrationService = new IntegrationService(repository, gatewayService, eventBus);
    webhookService = new WebhookService(repository, gatewayService, integrationService, eventBus);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and retrieve integration config', async () => {
    const created = await integrationService.createIntegration({
      company_id: '00000000-0000-0000-0000-000000000001',
      provider: 'TestGateway',
      type: GatewayType.SMS,
      config_json: { api_key: 'secret' },
    });

    expect(created.id).toBeDefined();
    expect(created.status).toBe(GatewayStatus.PENDING);

    const found = await integrationService.getIntegrationById(created.id);
    expect(found?.provider).toBe('TestGateway');

    // Cleanup
    await integrationService.deleteIntegration(created.id);
  });

  it('should generate and revoke API key', async () => {
    const key = await integrationService.generateApiKey({
      company_id: '00000000-0000-0000-0000-000000000001',
      name: 'Integration Test Key',
      permissions: ['gateway:read', 'webhook:read'],
      created_by: '00000000-0000-0000-0000-000000000002',
    });

    expect(key.plain_key).toBeDefined();
    expect(key.name).toBe('Integration Test Key');

    const keys = await integrationService.listApiKeys('00000000-0000-0000-0000-000000000001');
    expect(keys.some((k) => k.id === key.id)).toBe(true);

    await integrationService.revokeApiKey(key.id);
    const keysAfter = await integrationService.listApiKeys('00000000-0000-0000-0000-000000000001');
    expect(keysAfter.some((k) => k.id === key.id)).toBe(false);
  });

  it('should receive webhook and create log', async () => {
    const result = await webhookService.receiveWebhook('test-provider', {
      payload: { event: 'test.event' },
      headers: { 'x-test': 'value' },
      raw_body: '{"event":"test.event"}',
    });

    expect(result.received).toBe(true);
    expect(result.logId).toBeDefined();

    const log = await repository.findWebhookLogById(result.logId);
    expect(log).not.toBeNull();
    expect(log?.provider).toBe('test-provider');
  });

  it('should list integrations with pagination', async () => {
    const companyId = '00000000-0000-0000-0000-000000000003';
    const ids: string[] = [];

    for (let i = 0; i < 5; i++) {
      const c = await integrationService.createIntegration({
        company_id: companyId,
        provider: `Provider-${i}`,
        type: GatewayType.PAYMENT,
        config_json: {},
      });
      ids.push(c.id);
    }

    const page1 = await integrationService.listIntegrations({ company_id: companyId, page: 1, limit: 2 });
    expect(page1.items.length).toBe(2);
    expect(page1.total).toBe(5);

    // Cleanup
    await Promise.all(ids.map((id) => integrationService.deleteIntegration(id)));
  });
});
