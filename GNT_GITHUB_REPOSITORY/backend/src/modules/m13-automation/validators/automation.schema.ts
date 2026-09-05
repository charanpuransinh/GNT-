// M13 Automation Module - Zod Validation Schemas

import { z } from 'zod';

export const actionSchema = z.object({
  type: z.enum(['NOTIFY', 'WEBHOOK', 'LOG']),
  config: z.record(z.string(), z.unknown()),
});

export const createRuleSchema = z.object({
  name: z.string().min(1, 'नाम ज़रूरी है').max(200),
  description: z.string().max(2000).optional(),
  triggerType: z.enum(['EVENT', 'SCHEDULE', 'MANUAL']),
  triggerEvent: z.string().max(200).optional(),
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
  actions: z.array(actionSchema).min(1, 'कम से कम एक action चाहिए').max(50),
  isActive: z.boolean().optional(),
});

export const updateRuleSchema = z
  .object({
    name: z.string().min(1, 'नाम ख़ाली नहीं').max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    triggerEvent: z.string().max(200).nullable().optional(),
    triggerConfig: z.record(z.string(), z.unknown()).nullable().optional(),
    actions: z.array(actionSchema).min(1).max(50).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: 'बदलने के लिए कुछ भेजें' });

export const triggerRuleSchema = z.object({
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const createScheduleSchema = z.object({
  ruleId: z.string().min(1, 'ruleId ज़रूरी है'),
  name: z.string().min(1, 'नाम ज़रूरी है').max(200),
  cronExpr: z.string().min(1).max(100),
  timezone: z.string().max(64).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const updateScheduleSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  cronExpr: z.string().min(1).max(100).optional(),
  timezone: z.string().max(64).optional(),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
  status: z.enum(['ACTIVE', 'PAUSED']).optional(),
});
