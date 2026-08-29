/**
 * M18 — API Key Validation Tests
 * Covers the validateApiKey() fix (was previously a stub always
 * returning { valid: false }).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { IntegrationService } from '../../backend/src/modules/m18-external-integration/services/integration.service';
import { IntegrationRepository } from '../../backend/src/modules/m18-external-integration/repositories/integration.repository';
import { GatewayService } from '../../backend/src/modules/m18-external-integration/services/gateway.service';
import { EventEmitter } from 'events';

const mockPrisma = {
  integration_config: {},
  api_key_registry: { findUnique: vi.fn() },
  webhook_log: {},
} as any;

describe('M18 — validateApiKey', () => {
  let repository: IntegrationRepository;
  let service: IntegrationService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new IntegrationRepository(mockPrisma);
    const gatewayService = new GatewayService(repository);
    service = new IntegrationService(repository, gatewayService, new EventEmitter());
  });

  it('returns valid: true with permissions for a matching, unexpired key', async () => {
    const plainKey = 'sk_live_abc123';
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

    mockPrisma.api_key_registry.findUnique.mockResolvedValue({
      id: 'k1',
      key_hash: keyHash,
      permissions: ['notifications.send', 'reports.read'],
      expires_at: null,
    });

    const result = await service.validateApiKey(plainKey);

    expect(mockPrisma.api_key_registry.findUnique).toHaveBeenCalledWith({ where: { key_hash: keyHash } });
    expect(result).toEqual({ valid: true, permissions: ['notifications.send', 'reports.read'] });
  });

  it('returns valid: false when no key matches the hash', async () => {
    mockPrisma.api_key_registry.findUnique.mockResolvedValue(null);
    const result = await service.validateApiKey('sk_live_unknown');
    expect(result).toEqual({ valid: false });
  });

  it('returns valid: false when the key has expired', async () => {
    const plainKey = 'sk_live_expired';
    const keyHash = crypto.createHash('sha256').update(plainKey).digest('hex');

    mockPrisma.api_key_registry.findUnique.mockResolvedValue({
      id: 'k2',
      key_hash: keyHash,
      permissions: ['reports.read'],
      expires_at: new Date(Date.now() - 1000 * 60), // 1 minute ago
    });

    const result = await service.validateApiKey(plainKey);
    expect(result).toEqual({ valid: false });
  });

  it('never does a full-table scan — always queries by hash', async () => {
    mockPrisma.api_key_registry.findUnique.mockResolvedValue(null);
    await service.validateApiKey('any-key');
    expect(mockPrisma.api_key_registry.findUnique).toHaveBeenCalledTimes(1);
  });
});
