/**
 * M18 — Unit Tests
 * Owner: D4-DELTA
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntegrationService } from '../backend/src/modules/m18-external-integration/services/integration.service';
import { GatewayService } from '../backend/src/modules/m18-external-integration/services/gateway.service';
import { WebhookService } from '../backend/src/modules/m18-external-integration/services/webhook.service';
import { IntegrationRepository } from '../backend/src/modules/m18-external-integration/repositories/integration.repository';
import { IntegrationEventHandlers } from '../backend/src/modules/m18-external-integration/events/integration.handlers';
import { EventEmitter } from 'events';
import { GatewayType, GatewayStatus, WebhookStatus } from '../backend/src/modules/m18-external-integration/types/integration.types';

// Mock PrismaClient
const mockPrisma = {
  integration_config: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  api_key_registry: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  webhook_log: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
} as any;

describe('M18 Unit Tests', () => {
  let repository: IntegrationRepository;
  let gatewayService: GatewayService;
  let eventBus: EventEmitter;
  let integrationService: IntegrationService;
  let webhookService: WebhookService;

  beforeEach(() => {
    vi.clearAllMocks();
    eventBus = new EventEmitter();
    repository = new IntegrationRepository(mockPrisma);
    gatewayService = new GatewayService(repository);
    integrationService = new IntegrationService(repository, gatewayService, eventBus);
    webhookService = new WebhookService(repository, gatewayService, integrationService, eventBus);
  });

  describe('IntegrationService', () => {
    it('should create integration with PENDING status', async () => {
      const dto = {
        company_id: 'comp-1',
        provider: 'Razorpay',
        type: GatewayType.PAYMENT,
        config_json: { key_id: 'test' },
      };
      mockPrisma.integration_config.create.mockResolvedValue({ id: 'int-1', ...dto, status: 'pending' });

      const result = await integrationService.createIntegration(dto);
      expect(result.status).toBe(GatewayStatus.PENDING);
      expect(mockPrisma.integration_config.create).toHaveBeenCalledWith({
        data: { ...dto, status: GatewayStatus.PENDING },
      });
    });

    it('should emit status change event on update', async () => {
      const existing = {
        id: 'int-1',
        status: GatewayStatus.PENDING,
        provider: 'Twilio',
        type: GatewayType.SMS,
      };
      mockPrisma.integration_config.findUnique.mockResolvedValue(existing);
      mockPrisma.integration_config.update.mockResolvedValue({ ...existing, status: GatewayStatus.ACTIVE });

      const listener = vi.fn();
      eventBus.on('gateway.status.changed', listener);

      await integrationService.updateIntegration('int-1', { status: GatewayStatus.ACTIVE });
      expect(listener).toHaveBeenCalled();
    });

    it('should generate API key with hash (not plain)', async () => {
      mockPrisma.api_key_registry.create.mockResolvedValue({
        id: 'key-1',
        name: 'Test Key',
        key_hash: 'abc123',
        permissions: ['gateway:read'],
        expires_at: null,
        created_at: new Date(),
      });

      const result = await integrationService.generateApiKey({
        company_id: 'comp-1',
        name: 'Test Key',
        permissions: ['gateway:read'],
        created_by: 'user-1',
      });

      expect(result.plain_key).toBeDefined();
      expect(result.plain_key).toMatch(/^gnt_[a-f0-9]+$/);
    });
  });

  describe('GatewayService', () => {
    it('should throw if no active WhatsApp config found', async () => {
      mockPrisma.integration_config.findFirst.mockResolvedValue(null);
      await expect(
        gatewayService.sendWhatsApp('comp-1', { phone: '+91...', message: 'Hi' })
      ).rejects.toThrow('No active WhatsApp gateway configured');
    });

    it('should throw if no active SMS config found', async () => {
      mockPrisma.integration_config.findFirst.mockResolvedValue(null);
      await expect(
        gatewayService.sendSMS('comp-1', { phone: '+91...', message: 'Hi' })
      ).rejects.toThrow('No active SMS gateway configured');
    });

    it('should validate webhook signature correctly', () => {
      const secret = 'whsec_test';
      const body = '{"event":"payment.captured"}';
      const signature = require('crypto').createHmac('sha256', secret).update(body).digest('hex');

      const isValid = gatewayService.validateWebhookSignature('razorpay', body, signature, secret);
      expect(isValid).toBe(true);
    });
  });

  describe('WebhookService', () => {
    it('should log webhook immediately on receive', async () => {
      mockPrisma.webhook_log.create.mockResolvedValue({ id: 'log-1' });
      mockPrisma.integration_config.findMany.mockResolvedValue([]);

      await webhookService.receiveWebhook('razorpay', {
        payload: { event: 'test' },
        headers: {},
        raw_body: '{}',
      });

      expect(mockPrisma.webhook_log.create).toHaveBeenCalled();
    });
  });

  describe('IntegrationEventHandlers', () => {
    it('should register all event listeners', () => {
      const handlers = new IntegrationEventHandlers(eventBus);
      handlers.register();
      expect(eventBus.listenerCount('webhook.received')).toBe(1);
      expect(eventBus.listenerCount('gateway.status.changed')).toBe(1);
      expect(eventBus.listenerCount('payment.webhook.success')).toBe(1);
      expect(eventBus.listenerCount('payment.webhook.failed')).toBe(1);
    });
  });
});
