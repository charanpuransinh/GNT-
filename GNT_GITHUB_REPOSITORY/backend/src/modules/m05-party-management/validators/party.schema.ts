// ============================================================================
// M05 PARTY MANAGEMENT — Validators (Zod)
// टास्क #007 — GSTIN 15 अक्षर, phone, state_code 2 अंक की जाँच
// ============================================================================

import { z } from 'zod';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const partyTypeSchema = z.enum(['customer', 'supplier', 'both']);

const openingTypeSchema = z.enum(['dr', 'cr']);

export const createPartySchema = z.object({
  party_type: partyTypeSchema,
  name: z.string().min(1, 'Name is required').max(200),
  display_name: z.string().max(100).optional().nullable(),
  gstin: z.string().regex(GSTIN_REGEX, 'Invalid GSTIN (15-char format required)').optional().nullable(),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN').optional().nullable(),
  gst_type: z.enum(['regular', 'composition', 'unregistered', 'sez', 'overseas']).optional().nullable(),
  contact_person: z.string().max(100).optional().nullable(),
  phone: z.string().regex(/^[0-9+\-\s]{6,20}$/, 'Invalid phone number').optional().nullable(),
  alt_phone: z.string().regex(/^[0-9+\-\s]{6,20}$/, 'Invalid phone number').optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  billing_address: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state_code: z.string().regex(/^[0-9]{2}$/, 'state_code must be 2 digits (GST state code)').optional().nullable(),
  pincode: z.string().regex(/^[0-9]{6}$/, 'Invalid pincode').optional().nullable(),
  country: z.string().length(2).optional(),
  credit_limit: z.number().min(0).optional(),
  credit_days: z.number().int().min(0).optional(),
  opening_balance: z.number().optional(),
  opening_type: openingTypeSchema.optional(),
  notes: z.string().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
});

export const updatePartySchema = createPartySchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const partyQuerySchema = z.object({
  party_type: partyTypeSchema.optional(),
  search: z.string().optional(),
  is_active: z.boolean().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
});
