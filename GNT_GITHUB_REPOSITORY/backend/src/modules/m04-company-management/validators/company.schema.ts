import { z } from "zod";
export const companyProfileSchema = z.object({
  name: z.string().min(1).max(200),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
});
export const branchCreateSchema = z.object({ name: z.string().min(1).max(100), address: z.string().optional() });
export const financialYearSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), prefix: z.string().max(10),
});
export const rolePermissionsSchema = z.object({ permissions: z.array(z.string().uuid()) });
// पहले सिर्फ़ { name, email, roleId } जाँचता था — असली contract
// (api-contracts/v1/M04-company.contract.yaml — UserCreate) माँगता है
// username + password + role_ids भी। इनके बिना user_master बन ही नहीं सकता
// (दोनों कॉलम NOT NULL हैं) — यानी POST /company/users हमेशा फटता था।
export const userCreateSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  role_ids: z.array(z.string().uuid()).optional().default([]),
});
