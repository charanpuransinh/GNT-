/**
 * M18 — Frontend Zod Schemas (Form Validation)
 * Owner: D4-DELTA
 */
import { z } from 'zod';
import { GatewayType, GatewayStatus } from './integration.types';

export const integrationFormSchema = z.object({
  provider: z.string().min(1, 'Provider name is required').max(100),
  type: z.nativeEnum(GatewayType),
  config_json: z.record(z.unknown()).refine((val) => Object.keys(val).length > 0, {
    message: 'Configuration is required',
  }),
  is_active: z.boolean().default(true),
});

export const apiKeyFormSchema = z.object({
  name: z.string().min(1, 'Key name is required').max(100),
  permissions: z.array(z.string().min(1)).min(1, 'At least one permission is required'),
  expires_at: z.string().nullable().optional(),
});

export const testConnectionSchema = z.object({
  integration_id: z.string().uuid('Select a valid integration'),
});

export type IntegrationFormValues = z.infer<typeof integrationFormSchema>;
export type ApiKeyFormValues = z.infer<typeof apiKeyFormSchema>;
