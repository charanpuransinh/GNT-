/**
 * M18 — Gateway Failure Tests
 * Owner: D4-DELTA
 * 
 * Validates graceful degradation, retries, and error handling.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatewayService } from '../backend/src/modules/m18-external-integration/services/gateway.service';
import { IntegrationRepository } from '../backend/src/modules/m18-external-integration/repositories/integration.repository';
import { GatewayType, GatewayStatus } from '../backend/src/modules/m18-external-integration/types/integration.types';

const mockPrisma = {
  integration_config: {
    findFirst: vi.fn(),
  },
  api_key_registry: {},
  webhook_log: {},
} as any;

describe('M18 Gateway Failure Handling', () => {
  let gatewayService: GatewayService;
  let repository: IntegrationRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new IntegrationRepository(mockPrisma);
    gatewayService = new GatewayService(repository);
  });

  it('should fail gracefully when WhatsApp API returns 500', async () => {
    mockPrisma.integration_config.findFirst.mockResolvedValue({
      id: 'int-1',
      provider: 'WhatsApp Business API',
      type: GatewayType.WHATSAPP,
      config_json: { api_key: 'bad_key', phone_number_id: '123' },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    await expect(
      gatewayService.sendWhatsApp('comp-1', { phone: '+919999999999', message: 'Test' })
    ).rejects.toThrow('WhatsApp API error');
  });

  it('should fail gracefully when Twilio returns 401', async () => {
    mockPrisma.integration_config.findFirst.mockResolvedValue({
      id: 'int-2',
      provider: 'Twilio',
      type: GatewayType.SMS,
      config_json: { account_sid: 'sid', auth_token: 'bad_token', from_number: '+1...' },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    await expect(
      gatewayService.sendSMS('comp-1', { phone: '+919999999999', message: 'Test' })
    ).rejects.toThrow('Twilio error');
  });

  it('should return error status on test connection failure', async () => {
    const integration = {
      id: 'int-3',
      provider: 'Razorpay',
      type: GatewayType.PAYMENT,
      config_json: { key_id: 'bad', key_secret: 'bad' },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const result = await gatewayService.testConnection(integration as any);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Invalid');
    expect(result.latency_ms).toBeGreaterThanOrEqual(0);
  });

  it('should handle network timeout during test', async () => {
    const integration = {
      id: 'int-4',
      provider: 'Stripe',
      type: GatewayType.PAYMENT,
      config_json: { secret_key: 'sk_test' },
    };

    global.fetch = vi.fn().mockRejectedValue(new Error('Network timeout'));

    const result = await gatewayService.testConnection(integration as any);
    expect(result.success).toBe(false);
    expect(result.message).toBe('Network timeout');
  });

  it('should handle missing gateway configuration', async () => {
    mockPrisma.integration_config.findFirst.mockResolvedValue(null);

    await expect(
      gatewayService.processPayment('comp-1', {
        gateway: 'razorpay',
        amount: 100,
        currency: 'INR',
        order_id: 'order_1',
      })
    ).rejects.toThrow('No active payment gateway configured');
  });

  it('should handle unsupported payment provider', async () => {
    mockPrisma.integration_config.findFirst.mockResolvedValue({
      id: 'int-5',
      provider: 'UnknownPay',
      type: GatewayType.PAYMENT,
      config_json: { key: 'val' },
    });

    await expect(
      gatewayService.processPayment('comp-1', {
        gateway: 'unknownpay',
        amount: 100,
        currency: 'INR',
        order_id: 'order_1',
      })
    ).rejects.toThrow('Unsupported payment provider');
  });
});
