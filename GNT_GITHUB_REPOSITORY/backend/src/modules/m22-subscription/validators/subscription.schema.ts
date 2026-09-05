// M22 — Subscription validators (zod)
import { z } from 'zod';

export const createPlanSchema = z.object({
  code: z.string().min(1).max(40),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  priceMonthly: z.number().nonnegative(),
  priceYearly: z.number().nonnegative(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).default('MONTHLY'),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const updatePlanSchema = createPlanSchema.partial();

export const subscribeSchema = z.object({
  planId: z.string().min(1),
  autoRenew: z.boolean().default(false),
  endDate: z.string().datetime().optional(),
});
