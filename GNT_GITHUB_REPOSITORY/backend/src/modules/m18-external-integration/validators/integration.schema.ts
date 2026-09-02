/**
 * M18 — External Integration Zod Schemas
 * Owner: D4-DELTA
 */
import { z } from 'zod';
import { GatewayType, GatewayStatus, WebhookStatus } from '../types/integration.types';

export const createIntegrationSchema = z.object({
  company_id: z.string().uuid(),
  provider: z.string().min(1).max(100),
  type: z.nativeEnum(GatewayType),
  config_json: z.record(z.unknown()),
  is_active: z.boolean().optional().default(true),
});

export const updateIntegrationSchema = z.object({
  provider: z.string().min(1).max(100).optional(),
  config_json: z.record(z.unknown()).optional(),
  status: z.nativeEnum(GatewayStatus).optional(),
  is_active: z.boolean().optional(),
});

export const integrationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const createApiKeySchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  permissions: z.array(z.string().min(1)).min(1),
  expires_at: z.coerce.date().nullable().optional(),
  created_by: z.string().uuid(),
});

export const apiKeyIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const testGatewaySchema = z.object({
  integration_id: z.string().uuid(),
});

export const webhookProviderParamSchema = z.object({
  provider: z.string().min(1).max(100),
});

export const receiveWebhookSchema = z.object({
  payload: z.record(z.unknown()),
  headers: z.record(z.string()).optional().default({}),
});

export const createWebhookLogSchema = z.object({
  provider: z.string().min(1).max(100),
  payload: z.record(z.unknown()),
  headers: z.record(z.string()),
  status: z.nativeEnum(WebhookStatus).optional().default(WebhookStatus.RECEIVED),
  error_message: z.string().nullable().optional(),
});

export const listIntegrationsQuerySchema = z.object({
  company_id: z.string().uuid().optional(),
  type: z.nativeEnum(GatewayType).optional(),
  status: z.nativeEnum(GatewayStatus).optional(),
  is_active: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
export type TestGatewayInput = z.infer<typeof testGatewaySchema>;
export type ReceiveWebhookInput = z.infer<typeof receiveWebhookSchema>;
export type ListIntegrationsQuery = z.infer<typeof listIntegrationsQuerySchema>;
